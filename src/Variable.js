import { executeSlashCommands } from "../../../../slash-commands.js";
import { delay } from "../../../../utils.js";

export class Variable {
	/**@type {String}*/ name;
	/**@type {any}*/ value;
	/**@type {Boolean}*/ global;
	
	/**@type {HTMLElement}*/ dom;
	/**@type {HTMLInputElement}*/ domValue;

	/**@type {Number}*/ animStart;




	constructor(/**@type {String}*/name, /**@type {any}*/value, /**@type {Boolean}*/global) {
		this.name = name;
		this.value = value;
		this.global = global;
	}




	render() {
		if (!this.dom) {
			let ta;
			const v = document.createElement('div'); {
				this.dom = v;
				v.classList.add('vv--var');
				v.classList.add('vv--add');
				const head = document.createElement('div'); {
					head.classList.add('vv--head');
					const lbl = document.createElement('div'); {
						lbl.classList.add('vv--label');
						lbl.textContent = this.name;
						head.append(lbl);
					}
					const actions = document.createElement('div'); {
						actions.classList.add('vv--actions');
						const flush = document.createElement('span'); {
							flush.classList.add('vv--action');
							flush.textContent = '🚽';
							flush.title = 'Flush variable';
							flush.addEventListener('click', ()=>{
								executeSlashCommands(`/flush${this.global?'global':''}var ${this.name}`);
							});
							actions.append(flush);
						}
						const save = document.createElement('span'); {
							save.classList.add('vv--action');
							save.textContent = '💾';
							save.title = 'Set variable value';
							save.addEventListener('click', ()=>{
								executeSlashCommands(`/set${this.global?'global':''}var this.name="${this.name}" ${ta.value}`);
							});
							actions.append(save);
						}
						head.append(actions);
					}
					v.append(head);
				}
				const val = document.createElement('div'); {
					val.classList.add('vv--val');
					ta = document.createElement('textarea'); {
						this.domValue = ta;
						ta.value = this.value;
						val.append(ta);
					}
					v.append(val);
				}
			}
		}
		return this.dom;
	}

	async update(newVal) {
		this.dom.classList.remove('vv--add');
		this.dom.classList.remove('vv--update');
		await delay(1);
		const now = new Date().getTime();
		this.animStart = now;
		this.value = newVal;
		this.domValue.value = this.value;
		this.dom.classList.add('vv--update');
		await delay(2000);
		if (this.animStart == now) {
			this.dom.classList.remove('vv--update');
		}
	}
	async remove() {
		this.dom.classList.add('vv--remove');
		await delay(2000);
		this.dom.remove();
	}
}