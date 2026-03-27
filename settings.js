(() => {
    const MODULE_ID = "gurps-roll-reactions";
    const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const loc = (key) => game.i18n.localize(key);
    const fmt = (key, data) => game.i18n.format(key, data);

    const closeStaleReactionsDialog = (actorName) => {
        const title = fmt("GRR.sheet.universalTitle", { name: actorName });
        for (const app of Object.values(ui.windows)) {
            if (app.title === title) { app.close(); break; }
        }
    };

    Hooks.once("init", () => {
        game.settings.register(MODULE_ID, "enableGlow", {
            name: "GRR.settings.enableGlow.name",
            hint: "GRR.settings.enableGlow.hint",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.registerMenu(MODULE_ID, "manageReactionsMenu", {
            name: "GRR.settings.manage.name",
            label: "GRR.settings.manage.label",
            hint: "GRR.settings.manage.hint",
            icon: "fas fa-sliders-h",
            type: class GurpsManageReactions extends FormApplication {
                render() {
                    const actorsWithReactions = game.actors.contents.filter(a => {
                        const skills = a.getFlag(MODULE_ID, "skills") || {};
                        const weapons = a.getFlag(MODULE_ID, "weapons") || {};
                        const universal = a.getFlag(MODULE_ID, "universal") || {};
                        return Object.keys(skills).length > 0 || Object.keys(weapons).length > 0 || Object.keys(universal).length > 0;
                    });

                    const noReactionsHtml = `<p style="color: #777; font-style: italic; text-align: center; padding: 10px 0;">${loc("GRR.manage.noReactions")}</p>`;

                    const buildReactionsList = (actor) => {
                        const skills = actor.getFlag(MODULE_ID, "skills") || {};
                        const weapons = actor.getFlag(MODULE_ID, "weapons") || {};
                        const universal = actor.getFlag(MODULE_ID, "universal") || {};

                        const buildSection = (titleKey, data, type) => {
                            const keys = Object.keys(data);
                            if (!keys.length) return '';
                            return `
                                <div style="margin-bottom: 8px;">
                                    <div style="font-weight: bold; font-size: 0.85em; color: #555; margin-bottom: 4px; text-transform: uppercase;">${loc(titleKey)}</div>
                                    ${keys.map(k => `
                                        <div style="display: flex; align-items: center; padding: 4px 6px; border-bottom: 1px solid #eee;">
                                            <span style="flex: 1;">${esc(k)}</span>
                                            <a class="grr-delete-entry" data-type="${type}" data-key="${esc(k)}" style="color: #8b0000; cursor: pointer;" title="${loc("GRR.common.delete")}"><i class="fas fa-times"></i></a>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        };

                        const html = buildSection("GRR.manage.section.skills", skills, 'skills') +
                                     buildSection("GRR.manage.section.weapons", weapons, 'weapons') +
                                     buildSection("GRR.manage.section.universal", universal, 'universal');

                        return html || noReactionsHtml;
                    };

                    const emptyMsg = `<p style="color: #777; font-style: italic; text-align: center; padding: 10px 0;">${loc("GRR.manage.noActors")}</p>`;
                    const actorOptions = actorsWithReactions.length
                        ? actorsWithReactions.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')
                        : `<option disabled>${loc("GRR.manage.noActors")}</option>`;
                    const firstActor = actorsWithReactions[0];
                    const initialList = firstActor ? buildReactionsList(firstActor) : emptyMsg;

                    new Dialog({
                        title: loc("GRR.manage.title"),
                        content: `
                            <div style="margin-bottom: 8px;">
                                <select id="grr-actor-select" style="width: 100%;" ${!actorsWithReactions.length ? 'disabled' : ''}>
                                    ${actorOptions}
                                </select>
                            </div>
                            <div id="grr-reactions-list" style="max-height: 280px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 6px; margin-bottom: 10px;">
                                ${initialList}
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button type="button" id="grr-clear-actor" style="flex: 1;" ${!actorsWithReactions.length ? 'disabled' : ''}><i class="fas fa-user-times"></i> ${loc("GRR.manage.clearActor")}</button>
                                <button type="button" id="grr-clear-all" style="flex: 1; color: darkred;"><i class="fas fa-trash"></i> ${loc("GRR.manage.clearAll")}</button>
                            </div>
                        `,
                        render: (html) => {
                            const $html = $(html);

                            const refreshList = () => {
                                const actor = game.actors.get($html.find('#grr-actor-select').val());
                                if (actor) $html.find('#grr-reactions-list').html(buildReactionsList(actor));
                            };

                            $html.find('#grr-actor-select').change(refreshList);

                            $html.on('click', '.grr-delete-entry', async function(e) {
                                e.preventDefault();
                                const type = $(this).data('type');
                                const key = $(this).data('key');
                                const actor = game.actors.get($html.find('#grr-actor-select').val());
                                if (!actor) return;
                                await actor.setFlag(MODULE_ID, type, { [`-=${key}`]: null });
                                $(this).closest('div[style]').remove();
                            });

                            $html.find('#grr-clear-actor').click(async (e) => {
                                e.preventDefault();
                                const actor = game.actors.get($html.find('#grr-actor-select').val());
                                if (!actor) return;
                                if (actor.getFlag(MODULE_ID, "skills")) await actor.unsetFlag(MODULE_ID, "skills");
                                if (actor.getFlag(MODULE_ID, "weapons")) await actor.unsetFlag(MODULE_ID, "weapons");
                                if (actor.getFlag(MODULE_ID, "universal")) await actor.unsetFlag(MODULE_ID, "universal");
                                closeStaleReactionsDialog(actor.name);
                                $html.find('#grr-reactions-list').html(noReactionsHtml);
                                ui.notifications.info(fmt("GRR.manage.actorCleared", { name: actor.name }));
                            });

                            $html.find('#grr-clear-all').click(async (e) => {
                                e.preventDefault();
                                new Dialog({
                                    title: loc("GRR.manage.clearAllTitle"),
                                    content: `<p style="color: darkred; font-weight: bold;">${loc("GRR.common.warning")}</p>
                                              <p>${loc("GRR.manage.clearAllConfirm")}</p>
                                              <p>${loc("GRR.common.irreversible")}</p>`,
                                    buttons: {
                                        yes: {
                                            icon: '<i class="fas fa-trash"></i>',
                                            label: loc("GRR.manage.clearAll"),
                                            callback: async () => {
                                                let count = 0;
                                                for (const actor of game.actors.contents) {
                                                    let updated = false;
                                                    if (actor.getFlag(MODULE_ID, "skills")) { await actor.unsetFlag(MODULE_ID, "skills"); updated = true; }
                                                    if (actor.getFlag(MODULE_ID, "universal")) { await actor.unsetFlag(MODULE_ID, "universal"); updated = true; }
                                                    if (actor.getFlag(MODULE_ID, "weapons")) { await actor.unsetFlag(MODULE_ID, "weapons"); updated = true; }
                                                    if (updated) { closeStaleReactionsDialog(actor.name); count++; }
                                                }
                                                $html.find('#grr-reactions-list').html(noReactionsHtml);
                                                ui.notifications.info(fmt("GRR.manage.allCleared", { count }));
                                            }
                                        },
                                        no: { icon: '<i class="fas fa-times"></i>', label: loc("GRR.common.cancel") }
                                    },
                                    default: "no"
                                }).render(true);
                            });
                        },
                        buttons: { close: { label: loc("GRR.common.close") } },
                        default: "close"
                    }, { width: 420, resizable: true }).render(true);
                }
            },
            restricted: true
        });
    });
})();
