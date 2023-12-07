import { callPopup, chat_metadata } from "../../../../../script.js";
import { extension_settings, getContext } from "../../../../extensions.js";
import { executeSlashCommands } from "../../../../slash-commands.js";
import { delay } from "../../../../utils.js";

export class VariableViewer {
	/**@type {Boolean}*/ isShown = true;
	/**@type {Boolean}*/ isRunning = false;

	/**@type {HTMLElement}*/ dom;
	/**@type {HTMLElement}*/ content;

	/**@type {String}*/ oldLocalVars;
	/**@type {String}*/ oldGlobalVars;




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
					root.append(content);
				}
			}
		}
		document.body.append(this.dom);
		this.update();
	}

	renderVariables(panelTitle, variables, global) {
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
				vars.classList.add('vv--vars');
				Object.keys(variables).forEach(key=>{
					let ta;
					const v = document.createElement('div'); {
						v.classList.add('vv--var');
						const lbl = document.createElement('div'); {
							lbl.classList.add('vv--label');
							lbl.textContent = key;
							v.append(lbl);
						}
						const val = document.createElement('div'); {
							val.classList.add('vv--val');
							ta = document.createElement('textarea'); {
								ta.value = variables[key];
								val.append(ta);
							}
							v.append(val);
						}
						const actions = document.createElement('div'); {
							actions.classList.add('vv--actions');
							const flush = document.createElement('span'); {
								flush.classList.add('vv--action');
								flush.textContent = '🚽';
								flush.title = 'Flush variable';
								flush.addEventListener('click', ()=>{
									executeSlashCommands(`/flush${global?'global':''}var ${key}`);
								});
								actions.append(flush);
							}
							const save = document.createElement('span'); {
								save.classList.add('vv--action');
								save.textContent = '💾';
								save.title = 'Set variable value';
								save.addEventListener('click', ()=>{
									executeSlashCommands(`/set${global?'global':''}var key="${key}" ${ta.value}`);
								});
								actions.append(save);
							}
							v.append(actions);
						}
						vars.append(v);
					}
				});
				panel.append(vars);
			}
			this.content.append(panel);
		}
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
				this.content.innerHTML = '';
				this.renderVariables('Local Variables', localVars, false);
				this.renderVariables('Global Variables', globalVars, true);
			}
			await delay(200);
		}
		this.isRunning = false;
	}
}