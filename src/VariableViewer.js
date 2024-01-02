import { callPopup, chat_metadata, saveSettingsDebounced } from '../../../../../script.js';
import { dragElement } from '../../../../RossAscends-mods.js';
import { extension_settings } from '../../../../extensions.js';
import { loadMovingUIState } from '../../../../power-user.js';
import { executeSlashCommands } from '../../../../slash-commands.js';
import { delay } from '../../../../utils.js';
import { JsonVariable } from './JsonVariable.js';

export class VariableViewer {
    /**@type {Boolean}*/ isShown = true;
    /**@type {Boolean}*/ isRunning = false;

    /**@type {HTMLElement}*/ dom;
    /**@type {HTMLElement}*/ content;
    /**@type {HTMLElement}*/ localPanel;
    /**@type {HTMLElement}*/ globalPanel;

    /**@type {String}*/ oldLocalVars;
    /**@type {String}*/ oldGlobalVars;

    /**@type {JsonVariable[]}*/ localVarList = [];
    /**@type {JsonVariable[]}*/ globalVarList = [];




    constructor() {
        if (!extension_settings.variable_viewer) {
            extension_settings.variable_viewer = {};
            if (extension_settings.variable_viewer.isShown === undefined) {
                extension_settings.variable_viewer.isShown = true;
            }
            if (extension_settings.variable_viewer.fontSize === undefined) {
                extension_settings.variable_viewer.fontSize = 1.0;
            }
            saveSettingsDebounced();
        }
        this.isShown = extension_settings.variable_viewer.isShown;
        this.fontSize = extension_settings.variable_viewer.fontSize;
    }




    toggle() {
        this.isShown = !this.isShown;
        if (this.isShown) {
            this.render();
        } else {
            this.unrender();
        }
        extension_settings.variable_viewer.isShown = this.isShown;
        saveSettingsDebounced();
    }


    increaseFontSize() {
        this.fontSize += 0.05;
        this.saveFontSize();
    }
    decreaseFontSize() {
        this.fontSize -= 0.05;
        this.saveFontSize();
    }
    saveFontSize() {
        this.content.style.fontSize = `${this.fontSize}em`;
        extension_settings.variable_viewer.fontSize = this.fontSize;
        saveSettingsDebounced();
    }




    unrender() {
        this.dom?.remove();
    }
    render() {
        this.unrender();
        if (!this.isShown) return;
        if (!this.dom) {
            const root = document.createElement('div'); {
                this.dom = root;
                root.id = 'vv--root';
                root.classList.add('vv--root');
                root.classList.add('fillRight');
                root.classList.add('drawer-content');
                root.classList.add('openDrawer');
                //drawer-content fillRight openDrawer
                root.classList.add('pinnedOpen');
                root.classList.add('draggable');
                const fontSizeUp = document.createElement('div'); {
                    fontSizeUp.classList.add('vv--fontSizeUp');
                    fontSizeUp.classList.add('hoverglow');
                    fontSizeUp.textContent = '🗚';
                    fontSizeUp.title = 'Increase font size';
                    fontSizeUp.addEventListener('click', ()=>this.increaseFontSize());
                    root.append(fontSizeUp);
                }
                const fontSizeDown = document.createElement('div'); {
                    fontSizeDown.classList.add('vv--fontSizeDown');
                    fontSizeDown.classList.add('hoverglow');
                    fontSizeDown.title = 'Decrease font size';
                    fontSizeDown.textContent = '🗛';
                    fontSizeDown.addEventListener('click', ()=>this.decreaseFontSize());
                    root.append(fontSizeDown);
                }
                const max = document.createElement('div'); {
                    max.classList.add('vv--maximize');
                    max.classList.add('hoverglow');
                    max.title = 'Maximize';
                    max.textContent = '◱';
                    max.addEventListener('click', ()=>root.classList.toggle('vv--maximized'));
                    root.append(max);
                }
                const move = document.createElement('div'); {
                    move.id = 'vv--rootheader';
                    move.classList.add('vv--move');
                    move.classList.add('fa-solid');
                    move.classList.add('fa-grip');
                    move.classList.add('drag-grabber');
                    move.classList.add('hoverglow');
                    root.append(move);
                }
                const close = document.createElement('div'); {
                    close.classList.add('vv--close');
                    close.classList.add('fa-solid');
                    close.classList.add('fa-circle-xmark');
                    close.classList.add('hoverglow');
                    close.title = 'Close panel';
                    close.addEventListener('click', ()=>this.toggle());
                    root.append(close);
                }
                const content = document.createElement('div'); {
                    this.content = content;
                    content.classList.add('vv--content');
                    content.style.fontSize = `${this.fontSize}em`;
                    [['Local', false], ['Global', true]].forEach(([panelTitle,global])=>{
                        const panel = document.createElement('div'); {
                            panel.classList.add('vv--entry');
                            panel.classList.add('inline-drawer');
                            const title = document.createElement('div'); {
                                title.classList.add('vv--title');
                                const toggleWrapper = document.createElement('div'); {
                                    toggleWrapper.classList.add('inline-drawer-toggle');
                                    const toggle = document.createElement('div'); {
                                        toggle.classList.add('inline-drawer-icon');
                                        toggle.classList.add('fa-solid');
                                        toggle.classList.add('fa-circle-chevron-up');
                                        toggle.classList.add('down');
                                        toggleWrapper.append(toggle);
                                    }
                                    title.append(toggleWrapper);
                                }
                                const lbl = document.createElement('div'); {
                                    lbl.classList.add('vv--label');
                                    lbl.textContent = String(panelTitle);
                                    title.append(lbl);
                                }
                                const add = document.createElement('div'); {
                                    add.classList.add('vv--add');
                                    add.textContent = '➕';
                                    add.title = 'Add new variable';
                                    add.addEventListener('click', async()=>{
                                        const name = await callPopup('Variable Name', 'input', '', { okButton:'OK', rows:1, wide:false, large:false });
                                        if (!name) {
                                            return;
                                        }
                                        const val = await callPopup('Variable Value', 'input', '', { okButton:'OK', rows:1, wide:false, large:false });
                                        if (val === null || val === undefined) {
                                            return;
                                        }
                                        executeSlashCommands(`/set${global ? 'global' : ''}var key="${name}" ${val}`);
                                    });
                                    title.append(add);
                                }
                                const flushAll = document.createElement('div'); {
                                    flushAll.classList.add('vv--flushAll');
                                    flushAll.title = `Flush all ${global ? 'global' : 'local'} variables`;
                                    flushAll.addEventListener('click', async()=>{
                                        const result = await callPopup(`Are you sure you want to flush all ${global ? 'global' : 'local'} variables? This step cannot be undone.`, 'confirm');
                                        if (result === true) {
                                            const varList = (global ? this.globalVarList : this.localVarList)
                                                .map(it=>`/flush${global ? 'global' : ''}var ${it.name}`);
                                            executeSlashCommands(varList.join(' | '));
                                        }
                                    });
                                    const first = document.createElement('span'); {
                                        first.classList.add('vv--first');
                                        first.textContent = '🚽';
                                        flushAll.append(first);
                                    }
                                    const second = document.createElement('span'); {
                                        second.classList.add('vv--second');
                                        second.textContent = '🚽';
                                        flushAll.append(second);
                                    }
                                    title.append(flushAll);
                                }
                                panel.append(title);
                            }
                            const vars = document.createElement('div'); {
                                this[`${global ? 'global' : 'local'}Panel`] = vars;
                                vars.classList.add('vv--vars');
                                vars.classList.add('inline-drawer-content');
                                vars.style.display = 'block';
                                panel.append(vars);
                            }
                            this.content.append(panel);
                        }
                    });
                    root.append(content);
                }
            }
        }
        document.body.append(this.dom);
        loadMovingUIState();
        dragElement($(this.dom));

        this.update();
    }




    async update() {
        if (this.isRunning) return;
        this.isRunning = true;
        while (this.isShown) {
            const localVars = chat_metadata.variables ?? {};
            const globalVars = extension_settings?.variables?.global ?? {};
            const lv = JSON.stringify(localVars);
            const gv = JSON.stringify(globalVars);
            if (lv != this.oldLocalVars || gv != this.oldGlobalVars) {
                this.oldLocalVars = lv;
                this.oldGlobalVars = gv;
                console.log('[STVV]', localVars, globalVars);
                await this.updateVars(this.localVarList, localVars, this.localPanel, false);
                await this.updateVars(this.globalVarList, globalVars, this.globalPanel, true);
            }
            await delay(200);
        }
        this.isRunning = false;
    }


    async updateVars(oldVars, newVars, container, global) {
        newVars = Object.keys(newVars).map(key=>new JsonVariable(key, newVars[key], global)).toSorted((a,b)=>a.name.localeCompare(b.name));

        const toRemove = oldVars.filter(o=>!newVars.find(n=>o.name == n.name));
        toRemove.forEach(it=>it.remove());
        for (let i = oldVars.length - 1; i >= 0; i--) {
            const item = oldVars[i];
            if (toRemove.includes(item)) {
                oldVars.splice(i, 1);
            }
        }

        const toUpdate = oldVars.filter(o=>!o.equals(newVars.find(n=>o.name == n.name)));
        for (const o of toUpdate) {
            const n = newVars.find(n=>n.name == o.name);
            await o.update(n);
        }

        const toAdd = newVars.filter(n=>!oldVars.find(o=>n.name == o.name));
        oldVars.push(...toAdd);
        oldVars.sort((a,b)=>a.name.localeCompare(b.name));
        let prev;
        for (let i = oldVars.length - 1; i >= 0; i--) {
            const item = oldVars[i];
            if (toAdd.includes(item)) {
                if (prev) {
                    prev.dom.insertAdjacentElement('beforebegin', item.render());
                } else {
                    container.append(item.render());
                }
            }
            prev = item;
        }
    }
}
