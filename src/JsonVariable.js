import { executeSlashCommands } from '../../../../slash-commands.js';
import { delay } from '../../../../utils.js';

export class JsonVariable {
    /**@type {String}*/ name;
    /**@type {String}*/ value;
    /**@type {String}*/ cachedValue;
    /**@type {Boolean}*/ global;
    /**@type {String}*/ type = '$';
    /**@type {JsonVariable}*/ parent;
    /**@type {JsonVariable[]}*/ children = [];

    /**@type {HTMLElement}*/ dom;
    /**@type {HTMLElement}*/ domName;
    /**@type {HTMLElement}*/ domBody;
    /**@type {HTMLTextAreaElement}*/ domValue;

    /**@type {Number}*/ animStart;

    /**@type {Boolean}*/ isDeleted = false;

    /**@type {Function}*/ onRename = ()=>{};
    /**@type {Function}*/ onDelete = ()=>{};
    /**@type {Function}*/ onChange = ()=>{};
    /**@type {Function}*/ onUpdateState = ()=>{};
    /**@type {Function}*/ onSave = ()=>this.save();


    get isUnsaved() {
        return this.cachedValue != this.toJSON();
    }




    constructor(/**@type {String}*/name, /**@type {any}*/value, /**@type {Boolean}*/global, /**@type {JsonVariable}*/parent = null) {
        this.name = name;
        this.global = global;
        this.parent = parent;
        if (typeof value == 'string') {
            try {
                value = JSON.parse(value);
            } catch { /* empty */ }
        }
        if (value !== null && typeof value == 'object') {
            if (Array.isArray(value)) {
                this.type = '[]';
                this.children = value.map((it,idx)=>new JsonVariable(String(idx), it, global, this));
            } else {
                this.type = '{}';
                this.children = Object.keys(value).toSorted((a,b)=>a.localeCompare(b)).map(key=>new JsonVariable(key, value[key], global, this));
            }
            this.children.forEach(it=>this.hookChild(it));
        } else {
            this.value = value;
        }
        this.cachedValue = this.toJSON();
    }


    hookChild(/**@type {JsonVariable}*/child) {
        child.onDelete = ()=>{
            console.log('[VV]', 'onDelete', this, child);
            this.children.splice(this.children.indexOf(child), 1);
            if (!this.parent) {
                this.save();
            } else {
                this.onSave();
            }
        };
        child.onSave = ()=>{
            console.log('[VV]', 'onSave', this, child);
            if (!this.parent) {
                this.save();
            } else {
                this.onSave();
            }
        };

        // unused
        child.onChange = ()=>console.log('[VV]', 'onChange', this, child);
        child.onRename = ()=>console.log('[VV]', 'onRename', this, child);
        // child.onUpdateState = ()=>this.updateState();
    }

    toJSON(/**@type {Boolean}*/clearDeleted = false) {
        let result;
        switch (this.type) {
            case '$':
                result = String(this.value);
                break;
            case '[]':
                result = JSON.stringify(this.children.filter(it=>!it.isDeleted).map(it=>it.toJSON(clearDeleted)));
                break;
            case '{}':
                result = JSON.stringify(this.children.filter(it=>!it.isDeleted).reduce((obj,cur)=>{
                    obj[cur.name] = cur.toJSON(clearDeleted);
                    return obj;
                }, {}));
                break;
        }
        this.children.forEach(it=>it.isDeleted = false);
        return result;
    }

    equals(/**@type {JsonVariable}*/that) {
        return this.name == that.name && this.type == that.type && this.cachedValue == that.cachedValue;
    }

    save() {
        const j = this.toJSON(true);
        executeSlashCommands(`/set${this.global ? 'global' : ''}var key="${this.name}" ${j}`);
    }




    unrender() {
        this.dom?.remove();
        this.dom = null;
    }
    render() {
        if (!this.dom) {
            let ta;
            const v = document.createElement('div'); {
                this.dom = v;
                v.classList.add('vv--var');
                v.classList.add('vv--add');
                v.setAttribute('data-vv--type', this.type);
                const head = document.createElement('div'); {
                    head.classList.add('vv--head');
                    const lbl = document.createElement('div'); {
                        this.domName = lbl;
                        lbl.classList.add('vv--label');
                        lbl.textContent = this.name;
                        lbl.title = 'Click to collapse contents';
                        lbl.addEventListener('click', ()=>{
                            this.dom.classList.toggle('vv--collapsed');
                        });
                        head.append(lbl);
                    }
                    const type = document.createElement('div'); {
                        type.classList.add('vv--type');
                        type.textContent = this.type;
                        head.append(type);
                    }
                    const actions = document.createElement('div'); {
                        actions.classList.add('vv--actions');

                        if (this.parent?.type == '{}') {
                            const rename = document.createElement('span'); {
                                rename.classList.add('vv--rename');
                                rename.classList.add('vv--action');
                                rename.textContent = '✏️';
                                rename.title = 'Rename';
                                rename.addEventListener('click', ()=>{
                                    const newName = prompt('New Name:', this.name);
                                    if (newName?.length) {
                                        this.name = newName;
                                        this.domName.textContent = newName;
                                        this.onSave();
                                    }
                                });
                                actions.append(rename);
                            }
                        }
                        if (this.type == '{}' || this.type == '[]') {
                            const add = document.createElement('span'); {
                                add.classList.add('vv--add');
                                add.classList.add('vv--action');
                                add.textContent = '➕';
                                add.title = 'Add child entry';
                                add.addEventListener('click', ()=>{
                                    let newVar;
                                    if (this.type == '{}') {
                                        const newName = prompt('New Name:');
                                        if (newName?.length) {
                                            const newVal = prompt('Value:');
                                            if (newVal !== undefined) {
                                                newVar = new JsonVariable(newName, newVal, this.global, this);
                                            }
                                        }
                                    } else {
                                        const newVal = prompt('Value:');
                                        if (newVal !== undefined) {
                                            newVar = new JsonVariable(this.children.length.toString(), newVal, this.global, this);
                                        }
                                    }
                                    if (newVar) {
                                        this.hookChild(newVar);
                                        this.children.push(newVar);
                                        this.domBody.append(newVar.render());
                                        this.onSave();
                                    }
                                });
                                actions.append(add);
                            }
                        }
                        if (this.parent?.type == '{}' || this.parent?.type == '[]') {
                            const del = document.createElement('span'); {
                                del.classList.add('vv--del');
                                del.classList.add('vv--action');
                                del.textContent = '➖';
                                del.title = 'Remove entry';
                                del.addEventListener('click', ()=>{
                                    this.isDeleted = true;
                                    this.onSave();
                                });
                                actions.append(del);
                            }
                        }
                        if (!this.parent) {
                            const flush = document.createElement('span'); {
                                flush.classList.add('vv--action');
                                flush.classList.add('vv--mainAction');
                                flush.textContent = '🚽';
                                flush.title = 'Flush variable';
                                flush.addEventListener('click', ()=>{
                                    executeSlashCommands(`/flush${this.global ? 'global' : ''}var ${this.name}`);
                                });
                                actions.append(flush);
                            }
                            const save = document.createElement('span'); {
                                save.classList.add('vv--action');
                                save.classList.add('vv--mainAction');
                                save.textContent = '💾';
                                save.title = 'Set variable value';
                                save.addEventListener('click', async()=>{
                                    this.save();
                                });
                                actions.append(save);
                            }
                        }
                        head.append(actions);
                    }
                    v.append(head);
                }
                const body = document.createElement('div'); {
                    this.domBody = body;
                    body.classList.add('vv--body');
                    if (this.type == '$') {
                        const val = document.createElement('div'); {
                            val.classList.add('vv--val');
                            ta = document.createElement('textarea'); {
                                this.domValue = ta;
                                ta.rows = 1;
                                ta.value = this.value;
                                ta.addEventListener('input', ()=>{
                                    //TODO update unsaved status
                                    this.value = ta.value;
                                    this.dom.classList[this.isUnsaved ? 'add' : 'remove']('vv--unsaved');
                                });
                                val.append(ta);
                            }
                            body.append(val);
                        }
                    } else if (this.type == '[]') {
                        this.children.toSorted((a,b)=>Number(a) - Number(b)).forEach(it=>body.append(it.render()));
                    } else {
                        this.children.toSorted((a,b)=>a.name.localeCompare(b.name)).forEach(it=>body.append(it.render()));
                    }
                    v.append(body);
                }
            }
        }
        delay(2000).then(()=>this.dom.classList.remove('vv--add'));
        return this.dom;
    }

    async update(/**@type {JsonVariable}*/nv) {
        console.log('[VV]', 'update', this, nv);
        let now;
        const childUpdates = [];
        if (this.type == '$' || this.type != nv.type || this.name != nv.name) {
            this.dom.classList.remove('vv--add');
            this.dom.classList.remove('vv--update');
            await delay(1);
            now = new Date().getTime();
            this.animStart = now;
        }

        if (this.name != nv.name) {
            this.name = nv.name;
            this.domName.textContent = nv.name;
        }

        if (this.type != nv.type) {
            this.type = nv.type;
            this.children = nv.children;
            this.cachedValue = nv.cachedValue;
            this.value = nv.value;
            const oldDom = this.dom;
            this.dom = null;
            oldDom.replaceWith(this.render());
        } else {
            if (this.type == '$') {
                this.value = nv.value;
                this.domValue.value = this.value;
            } else if (this.type == '{}' || this.type == '[]') {
                while (this.children.length > nv.children.length) {
                    console.log('[VV]', 'removing child', this, this.children[this.children.length - 1]);
                    this.children.pop().remove();
                }
                while (this.children.length < nv.children.length) {
                    console.log('[VV]', 'adding child', nv.children[this.children.length]);
                    const newItem = nv.children[this.children.length];
                    this.children.push(newItem);
                    this.domBody.append(newItem.render());
                }
                if (this.type == '{}') {
                    for (let i = 0;i < this.children.length;i++) {
                        if (!this.children[i].equals(nv.children[i])) {
                            childUpdates.push(this.children[i].update(nv.children[i]));
                        }
                    }
                } else if (this.type == '[]') {
                    for (let i = 0;i < this.children.length;i++) {
                        if (!this.children[i].equals(nv.children[i])) {
                            childUpdates.push(this.children[i].update(nv.children[i]));
                        }
                    }
                }
            }
        }
        await Promise.all(childUpdates);
        this.cachedValue = this.toJSON();
        if (now) {
            this.dom.classList.add('vv--update');
            delay(2000).then(async()=>{
                if (this.animStart == now) {
                    this.dom.classList.remove('vv--update');
                }
                this.dom.classList[this.isUnsaved ? 'add' : 'remove']('vv--unsaved');
                if (this.isUnsaved) {
                    console.log('[VV]', 'unsaved', this.cachedValue, this.toJSON(), this);
                }
            });
        }
    }

    async remove() {
        this.dom.classList.add('vv--remove');
        await delay(2000);
        this.dom.remove();
    }
}
