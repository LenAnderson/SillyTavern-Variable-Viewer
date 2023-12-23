import { registerSlashCommand } from '../../../slash-commands.js';
import { VariableViewer } from './src/VariableViewer.js';

const app = new VariableViewer();

registerSlashCommand('variableviewer', ()=>app.toggle(), [], 'show / hide the variable viewer panel', true, true);

$(document).ready(function () {
    app.render();
});
