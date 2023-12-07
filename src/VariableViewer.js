import { callPopup, chat_metadata } from "../../../../../script.js";
import { extension_settings, getContext } from "../../../../extensions.js";
import { executeSlashCommands } from "../../../../slash-commands.js";
import { delay } from "../../../../utils.js";
import { Variable } from "./Variable.js";

export class VariableViewer {
	/**@type {Boolean}*/ isShown = true;
	/**@type {Boolean}*/ isRunning = false;

	/**@type {HTMLElement}*/ dom;
	/**@type {HTMLElement}*/ content;
	/**@type {HTMLElement}*/ localPanel;
	/**@type {HTMLElement}*/ globalPanel;

	/**@type {String}*/ oldLocalVars;
	/**@type {String}*/ oldGlobalVars;

	/**@type {Variable[]}*/ localVarList = [];
	/**@type {Variable[]}*/ globalVarList = [];




	toggle() {
		this.isShown = !this.isShown;
		if (this.isShown) {
			this.render();
		} else {
			this.unrender();
		}
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
				root.classList.add('drawer-content');
				root.classList.add('pinnedOpen');
				const close = document.createElement('div'); {
					close.classList.add('vv--close');
					close.textContent = 'X';
					close.title = 'Close panel';
					close.addEventListener('click', ()=>this.toggle());
					root.append(close);
				}
				const content = document.createElement('div'); {
					this.content = content;
					content.classList.add('vv--content');
					[['Local', false], ['Global', true]].forEach(([panelTitle,global])=>{
						const panel = document.createElement('div'); {
							panel.classList.add('vv--entry');
							const title = document.createElement('div'); {
								title.classList.add('vv--title');
								title.textContent = panelTitle;
								const add = document.createElement('div'); {
									add.classList.add('vv--add');
									add.textContent ='➕';
									add.title = 'Add new variable';
									add.addEventListener('click', async()=>{
										const name = await callPopup('Variable Name', 'input', '', {okButton:'OK', rows:1, wide:false, large:false});
										if (!name) {
											return;
										}
										const val = await callPopup('Variable Value', 'input', '', {okButton:'OK', rows:1, wide:false, large:false});
										if (val === null || val === undefined) {
											return;
										}
										executeSlashCommands(`/set${global?'global':''}var key="${name}" ${val}`);
									});
									title.append(add);
								}
								panel.append(title);
							}
							const vars = document.createElement('div'); {
								this[`${global?'global':'local'}Panel`] = vars;
								vars.classList.add('vv--vars');
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
				this.updateVars(this.localVarList, localVars, this.localPanel, false);
				this.updateVars(this.globalVarList, globalVars, this.globalPanel, true);
			}
			await delay(200);
		}
		this.isRunning = false;
	}


	updateVars(oldVars, newVars, container, global) {
		newVars = Object.keys(newVars).map(key=>new Variable(key, newVars[key], global)).toSorted((a,b)=>a.name.localeCompare(b.name));
		
		const toRemove = oldVars.filter(o=>!newVars.find(n=>o.name==n.name));
		toRemove.forEach(it=>it.remove());
		for (let i=oldVars.length-1; i>=0; i--) {
			const item = oldVars[i];
			if (toRemove.includes(item)) {
				oldVars.splice(i, 1);
			}
		}

		const toUpdate = oldVars.filter(o=>o.value!=newVars.find(n=>o.name==n.name).value);
		toUpdate.forEach(o=>o.update(newVars.find(n=>n.name==o.name).value));
		
		const toAdd = newVars.filter(n=>!oldVars.find(o=>n.name==o.name));
		oldVars.push(...toAdd);
		oldVars.sort((a,b)=>a.name.localeCompare(b.name));
		let prev;
		for (let i=oldVars.length-1; i>=0; i--) {
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