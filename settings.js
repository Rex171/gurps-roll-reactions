(() => {
    const MODULE_ID = "gurps-roll-reactions";
    const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // Закрывает диалог "Реакции" для указанного актора, если он открыт
    const closeStaleReactionsDialog = (actorName) => {
        for (const app of Object.values(ui.windows)) {
            if (app.title === `Реакции: ${actorName}`) { app.close(); break; }
        }
    };

    Hooks.once("init", () => {
        game.settings.register(MODULE_ID, "enableGlow", {
            name: "Свечение при критических бросках",
            hint: "Включает зеленую и красную рамки вокруг картинок при критических бросках. Настройка индивидуальна для каждого игрока.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.registerMenu(MODULE_ID, "manageReactionsMenu", {
            name: "Управление реакциями",
            label: "Управлять реакциями",
            hint: "Удалить реакции у конкретного персонажа или сбросить всё.",
            icon: "fas fa-sliders-h",
            type: class GurpsManageReactions extends FormApplication {
                render() {
                    const actorsWithReactions = game.actors.contents.filter(a => {
                        const skills = a.getFlag(MODULE_ID, "skills") || {};
                        const weapons = a.getFlag(MODULE_ID, "weapons") || {};
                        const universal = a.getFlag(MODULE_ID, "universal") || {};
                        return Object.keys(skills).length > 0 || Object.keys(weapons).length > 0 || Object.keys(universal).length > 0;
                    });

                    const buildReactionsList = (actor) => {
                        const skills = actor.getFlag(MODULE_ID, "skills") || {};
                        const weapons = actor.getFlag(MODULE_ID, "weapons") || {};
                        const universal = actor.getFlag(MODULE_ID, "universal") || {};

                        const buildSection = (title, data, type) => {
                            const keys = Object.keys(data);
                            if (!keys.length) return '';
                            return `
                                <div style="margin-bottom: 8px;">
                                    <div style="font-weight: bold; font-size: 0.85em; color: #555; margin-bottom: 4px; text-transform: uppercase;">${title}</div>
                                    ${keys.map(k => `
                                        <div style="display: flex; align-items: center; padding: 4px 6px; border-bottom: 1px solid #eee;">
                                            <span style="flex: 1;">${esc(k)}</span>
                                            <a class="grr-delete-entry" data-type="${type}" data-key="${esc(k)}" style="color: #8b0000; cursor: pointer;" title="Удалить"><i class="fas fa-times"></i></a>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        };

                        const html = buildSection('Навыки', skills, 'skills') +
                                     buildSection('Оружие', weapons, 'weapons') +
                                     buildSection('Универсальные', universal, 'universal');

                        return html || '<p style="color: #777; font-style: italic; text-align: center; padding: 10px 0;">Нет реакций</p>';
                    };

                    const emptyMsg = '<p style="color: #777; font-style: italic; text-align: center; padding: 10px 0;">Нет персонажей с реакциями</p>';
                    const actorOptions = actorsWithReactions.length
                        ? actorsWithReactions.map(a => `<option value="${a.id}">${esc(a.name)}</option>`).join('')
                        : '<option disabled>Нет персонажей с реакциями</option>';
                    const firstActor = actorsWithReactions[0];
                    const initialList = firstActor ? buildReactionsList(firstActor) : emptyMsg;

                    new Dialog({
                        title: "Управление реакциями",
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
                                <button type="button" id="grr-clear-actor" style="flex: 1;" ${!actorsWithReactions.length ? 'disabled' : ''}><i class="fas fa-user-times"></i> Очистить персонажа</button>
                                <button type="button" id="grr-clear-all" style="flex: 1; color: darkred;"><i class="fas fa-trash"></i> Сбросить всё</button>
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
                                $html.find('#grr-reactions-list').html('<p style="color: #777; font-style: italic; text-align: center; padding: 10px 0;">Нет реакций</p>');
                                ui.notifications.info(`Реакции персонажа "${actor.name}" сброшены.`);
                            });

                            $html.find('#grr-clear-all').click(async (e) => {
                                e.preventDefault();
                                new Dialog({
                                    title: "Сброс всех реакций",
                                    content: `<p style="color: darkred; font-weight: bold;">ВНИМАНИЕ!</p>
                                              <p>Все настроенные реакции у всех персонажей будут удалены.</p>
                                              <p>Это действие необратимо. Продолжить?</p>`,
                                    buttons: {
                                        yes: {
                                            icon: '<i class="fas fa-trash"></i>',
                                            label: "Удалить всё",
                                            callback: async () => {
                                                let count = 0;
                                                for (const actor of game.actors.contents) {
                                                    let updated = false;
                                                    if (actor.getFlag(MODULE_ID, "skills")) { await actor.unsetFlag(MODULE_ID, "skills"); updated = true; }
                                                    if (actor.getFlag(MODULE_ID, "universal")) { await actor.unsetFlag(MODULE_ID, "universal"); updated = true; }
                                                    if (actor.getFlag(MODULE_ID, "weapons")) { await actor.unsetFlag(MODULE_ID, "weapons"); updated = true; }
                                                    if (updated) { closeStaleReactionsDialog(actor.name); count++; }
                                                }
                                                $html.find('#grr-reactions-list').html('<p style="color: #777; font-style: italic; text-align: center; padding: 10px 0;">Нет реакций</p>');
                                                ui.notifications.info(`Реакции сброшены. Затронуто персонажей: ${count}`);
                                            }
                                        },
                                        no: { icon: '<i class="fas fa-times"></i>', label: "Отмена" }
                                    },
                                    default: "no"
                                }).render(true);
                            });
                        },
                        buttons: { close: { label: "Закрыть" } },
                        default: "close"
                    }, { width: 420, resizable: true }).render(true);
                }
            },
            restricted: true
        });
    });
})();
