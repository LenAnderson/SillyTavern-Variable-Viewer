import { chat_metadata } from "../../../../../script.js";
import { extension_settings, getContext } from "../../../../extensions.js";
import { delay } from "../../../../utils.js";

export class VariableViewer {
	/**@type {Boolean}*/ isShown = true;
	/**@type {Boolean}*/ isRunning = false;

	/**@type {HTMLElement}*/ dom;




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
		const root = document.createElement('div'); {
			this.dom = root;
			root.id = 'vv--root';
			root.classList.add('vv--root');
			root.classList.add('drawer-content');
			root.classList.add('pinnedOpen');
			document.body.append(root);
		}
		this.update();
	}

	renderVariables(panelTitle, variables) {
		const panel = document.createElement('div'); {
			panel.classList.add('vv--entry');
			const title = document.createElement('div'); {
				title.classList.add('vv--title');
				title.textContent = panelTitle;
				panel.append(title);
			}
			const vars = document.createElement('div'); {
				vars.classList.add('vv--vars');
				Object.keys(variables).forEach(key=>{
					const v = document.createElement('div'); {
						v.classList.add('vv--var');
						const lbl = document.createElement('div'); {
							lbl.classList.add('vv--label');
							lbl.textContent = key;
							v.append(lbl);
						}
						const val = document.createElement('div'); {
							val.classList.add('vv--val');
							val.textContent = variables[key];
							v.append(val);
						}
						vars.append(v);
					}
				});
				panel.append(vars);
			}
			this.dom.append(panel);
		}
	}




	async update() {
		if (this.isRunning) return;
		this.isRunning = true;
		while (this.isShown) {
			const localVars = chat_metadata.variables ?? {};
			const globalVars = extension_settings?.variables?.global ?? {};
			console.log('[STVV]', localVars, globalVars);
			this.dom.innerHTML = '';
			this.renderVariables('Local Variables', localVars);
			this.renderVariables('Global Variables', globalVars);
			await delay(200);
		}
		this.isRunning = false;
	}
}