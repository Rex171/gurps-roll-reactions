(() => {
    const MODULE_ID = GRR_Shared.MODULE_ID;
    const esc = GRR_Shared.escapeHTML;

    // ШАБЛОН: Иконка теста (устанавливается только в заголовки секций)
    const testBtnHtml = (section) => `
        <a class="grr-test-btn" title="Тест реакции" data-section="${section}" style="color: #555; margin-left: 8px; cursor: pointer; transition: color 0.2s; font-size: 1.1em;"><i class="fas fa-dice"></i></a>
    `;

    Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
        if (game.system.id !== "gurps") return;
        buttons.unshift({ label: "Реакции", class: "gurps-media-btn", icon: "fas fa-film", onclick: () => openMediaManager(sheet.actor) });
    });

    function buildUniversalRow(trigger, urls) {
        return `
        <div class="gurps-media-row" style="border: 1px solid #777; padding: 8px; margin-bottom: 8px; border-radius: 5px; background: rgba(0,0,0,0.05); transition: background 0.2s;">
            <div style="display: flex; margin-bottom: 5px; align-items: center;">
                <b style="flex: 0 0 100px;">Триггер:</b>
                <input type="text" class="trigger-name" value="${esc(trigger)}" placeholder="DX, Dodge" style="flex: 1;">
                ${testBtnHtml('universal')}
                <a class="remove-media-btn" style="color: darkred; margin-left: 10px; cursor: pointer;" title="Удалить"><i class="fas fa-trash"></i></a>
            </div>
            <div style="display: flex; margin-bottom: 3px; align-items: center;"><label style="flex: 0 0 100px;">Обычный:</label><input type="text" class="trigger-def" value="${esc(urls.defaultGif)}" placeholder="Сработает на всё, если нет других" style="flex: 1;"></div>
            <div style="display: flex; margin-bottom: 3px; align-items: center;"><label style="flex: 0 0 100px; color: #b85c00;">Провал:</label><input type="text" class="trigger-f" value="${esc(urls.failGif)}" placeholder="Опционально" style="flex: 1;"></div>
            <div style="display: flex; margin-bottom: 3px; align-items: center;"><label style="flex: 0 0 100px; color: green;">Крит Успех:</label><input type="text" class="trigger-cs" value="${esc(urls.critSuccessGif)}" placeholder="Опционально" style="flex: 1;"></div>
            <div style="display: flex; margin-bottom: 3px; align-items: center;"><label style="flex: 0 0 100px; color: red;">Крит Провал:</label><input type="text" class="trigger-cf" value="${esc(urls.critFailGif)}" placeholder="Опционально" style="flex: 1;"></div>
        </div>`;
    }

    function openMediaManager(actor) {
        const currentFlags = actor.getFlag(MODULE_ID, "universal") || {};
        let rowsHtml = "";
        for (const [trigger, urls] of Object.entries(currentFlags)) rowsHtml += buildUniversalRow(trigger, urls);

        new Dialog({
            title: `Реакции: ${actor.name}`,
            content: `
                <div style="margin-bottom: 10px;"><p style="font-size: 0.9em; color: #444;">Реакции для атрибутов, вторичных характеристик, преимуществ и недостатков и т.п.</p></div>
                <div id="gurps-media-list" style="max-height: 400px; overflow-y: auto; padding-right: 5px; margin-bottom: 10px;">${rowsHtml}</div>
                <div style="text-align: center; margin-bottom: 10px;"><button id="add-gurps-media"><i class="fas fa-plus"></i> Добавить</button></div>
            `,
            render: (html) => {
                const $html = $(html);
                $html.find('#add-gurps-media').click((e) => { e.preventDefault(); $html.find('#gurps-media-list').append(buildUniversalRow("", {})); });
                $html.on('click', '.remove-media-btn', function(e) { e.preventDefault(); $(this).closest('.gurps-media-row').fadeOut(200, function() { $(this).remove(); }); });
                
                $html.on('click', '.grr-test-btn', function(e) {
                    e.preventDefault();
                    const row = $(this).closest('.gurps-media-row');
                    const title = row.find('.trigger-name').val() || "Без названия";
                    const urls = {
                        def: row.find('.trigger-def').val(),
                        f: row.find('.trigger-f').val(),
                        cs: row.find('.trigger-cs').val(),
                        cf: row.find('.trigger-cf').val()
                    };
                    GRR_Shared.openTestModal(title, urls);
                });
            },
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>', label: "Сохранить",
                    callback: async (html) => {
                        const newFlags = {};
                        $(html).find('.gurps-media-row').each(function() {
                            const trigger = $(this).find('.trigger-name').val().trim();
                            if (trigger) newFlags[trigger] = { defaultGif: $(this).find('.trigger-def').val().trim(), failGif: $(this).find('.trigger-f').val().trim(), critSuccessGif: $(this).find('.trigger-cs').val().trim(), critFailGif: $(this).find('.trigger-cf').val().trim() };
                        });
                        const payload = {};
                        for (let oldKey of Object.keys(currentFlags)) if (!newFlags.hasOwnProperty(oldKey)) payload[`-=${oldKey}`] = null;
                        Object.assign(payload, newFlags);
                        if (Object.keys(payload).length > 0) await (game.actors.get(actor.id) ?? actor).setFlag(MODULE_ID, "universal", payload);
                    }
                }
            },
            default: "save"
        }, { width: 550, resizable: true }).render(true);
    }

    // --- ИКОНКИ ДЛЯ НАВЫКОВ И ОРУЖИЯ ---
    Hooks.on("renderActorSheet", (app, html) => {
        if (game.system.id !== "gurps") return;
        const actor = app.actor;
        const $html = $(html);

        // Обработка навыков
        $html.find('div[data-key^="system.skills"], div[data-key^="system.spells"]').each((_index, element) => {
            const descDiv = $(element).find('.gga-line-description');
            if (descDiv.find('.gurps-gif-settings-btn').length > 0) return;
            const skillNameText = descDiv.find('.tooltip').text().trim();
            if (!skillNameText) return;

            const btn = $(`<a class="gurps-gif-settings-btn" title="Реакции навыка" style="margin-left: 8px; color: #8b0000; cursor: pointer; flex-shrink: 0; transition: all 0.2s;"><i class="fas fa-image"></i></a>`);
            const dataKey = $(element).attr('data-key');
            const skillData = foundry.utils.getProperty(actor, dataKey);
            const skillLevel = skillData?.level ?? 10;

            btn.click(async (e) => {
                e.preventDefault(); e.stopPropagation();
                const allSkillGifs = actor.getFlag(MODULE_ID, "skills") || {};
                const myGifs = allSkillGifs[skillNameText] || {};

                new Dialog({
                    title: "Реакции навыка",
                    content: `
                        <div style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                            <span>Навык: <b>${esc(skillNameText)}</b></span>
                            ${testBtnHtml('skill')}
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 5px;"><label style="flex: 1;">Обычный:</label><input type="text" id="gif-def" value="${esc(myGifs.defaultGif)}" style="flex: 2;"></div>
                        <div style="display: flex; align-items: center; margin-bottom: 10px;"><label style="flex: 1; color: #b85c00;">Провал:</label><input type="text" id="gif-f" value="${esc(myGifs.failGif)}" placeholder="Опционально" style="flex: 2;"></div>
                        <div style="display: flex; align-items: center; margin-bottom: 5px;"><label style="flex: 1; color: green;">Крит Успех:</label><input type="text" id="gif-cs" value="${esc(myGifs.critSuccessGif)}" placeholder="Опционально" style="flex: 2;"></div>
                        <div style="display: flex; align-items: center; margin-bottom: 15px;"><label style="flex: 1; color: red;">Крит Провал:</label><input type="text" id="gif-cf" value="${esc(myGifs.critFailGif)}" placeholder="Опционально" style="flex: 2;"></div>
                    `,
                    render: (dHtml) => {
                        $(dHtml).find('.grr-test-btn').click(function(e) {
                            e.preventDefault();
                            GRR_Shared.openTestModal(skillNameText, {
                                def: $(dHtml).find('#gif-def').val(), f: $(dHtml).find('#gif-f').val(), cs: $(dHtml).find('#gif-cs').val(), cf: $(dHtml).find('#gif-cf').val()
                            }, skillLevel);
                        });
                    },
                    buttons: {
                        save: {
                            icon: '<i class="fas fa-save"></i>', label: "Сохранить",
                            callback: async (dHtml) => {
                                const updatedGifs = foundry.utils.mergeObject(allSkillGifs, {
                                    [skillNameText]: { defaultGif: $(dHtml).find('#gif-def').val().trim(), failGif: $(dHtml).find('#gif-f').val().trim(), critSuccessGif: $(dHtml).find('#gif-cs').val().trim(), critFailGif: $(dHtml).find('#gif-cf').val().trim() }
                                });
                                await (game.actors.get(actor.id) ?? actor).setFlag(MODULE_ID, "skills", updatedGifs);
                            }
                        }
                    },
                    default: "save"
                }).render(true);
            });
            descDiv.append(btn);
        });

        // Обработка оружия
        $html.find('.meleedraggable, .rangeddraggable, div[data-key^="system.melee"], div[data-key^="system.ranged"]').each((_index, element) => {
            const descDiv = $(element).find('.desc').first(); 
            if (!descDiv.length || descDiv.find('.gurps-wpn-settings-btn').length > 0) return;
            const weaponNameText = descDiv.find('.tooltip').first().text().trim();
            if (!weaponNameText) return;

            const btn = $(`<a class="gurps-wpn-settings-btn" title="Реакции оружия" style="margin-left: 6px; color: #1e4a8b; font-size: 1.1em; cursor: pointer; flex-shrink: 0; transition: all 0.2s;"><i class="fas fa-khanda"></i></a>`);
            descDiv.find('.tooltip').first().after(btn);

            btn.click(async (e) => {
                e.preventDefault(); e.stopPropagation();
                const allWpnGifs = actor.getFlag(MODULE_ID, "weapons") || {};
                const defaultStructure = { atk: { def: "", f: "", cs: "", cf: "", useCrit: false }, parry: { enabled: false, def: "", f: "", cs: "", cf: "", useCrit: false }, block: { enabled: false, def: "", f: "", cs: "", cf: "", useCrit: false } };
                const myGifs = foundry.utils.mergeObject(defaultStructure, allWpnGifs[weaponNameText] || {});

                new Dialog({
                    title: "Реакции оружия",
                    content: `
                    <div style="margin-bottom: 10px; text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 5px;"><b>${esc(weaponNameText)}</b></div>
                    
                    <div style="margin-bottom: 15px; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 5px; border-left: 4px solid #8b0000;">
                        <b style="color: #660000; display: flex; align-items: center;"><i class="fas fa-fist-raised" style="margin-right: 5px;"></i> Бросок Атаки ${testBtnHtml('atk')}</b>
                        <div style="display: flex; margin-top: 5px;">
                            <input type="text" id="atk-def" value="${esc(myGifs.atk.def)}" placeholder="Успех (или всё)" style="flex: 1; margin-right: 3px;">
                            <input type="text" id="atk-f" value="${esc(myGifs.atk.f)}" placeholder="Провал" style="flex: 1; margin-left: 3px;">
                        </div>
                        <div style="margin-top: 5px;"><label><input type="checkbox" id="atk-crit-chk" ${myGifs.atk.useCrit ? "checked" : ""}> <i>Критические броски?</i></label></div>
                        <div id="atk-crit-box" style="display: none; margin-top: 5px; padding-left: 10px;">
                            <div style="display: flex; align-items: center; margin-bottom: 3px;"><label style="flex: 0 0 80px; color: green;">Успех:</label><input type="text" id="atk-cs" value="${esc(myGifs.atk.cs)}" placeholder="Опционально" style="flex: 1;"></div>
                            <div style="display: flex; align-items: center;"><label style="flex: 0 0 80px; color: red;">Провал:</label><input type="text" id="atk-cf" value="${esc(myGifs.atk.cf)}" placeholder="Опционально" style="flex: 1;"></div>
                        </div>
                    </div>

                    <div style="margin-bottom: 15px; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 5px; border-left: 4px solid #006600;">
                        <label style="font-weight: bold; color: #004400; cursor: pointer; display: flex; align-items: center;">
                            <input type="checkbox" id="parry-en-chk" ${myGifs.parry.enabled ? "checked" : ""}> 
                            <i class="fas fa-shield-alt" style="margin-left:5px; margin-right:3px;"></i> Есть Парирование? ${testBtnHtml('parry')}
                        </label>
                        <div id="parry-main-box" style="display: none; margin-top: 5px;">
                            <div style="display: flex;">
                                <input type="text" id="parry-def" value="${esc(myGifs.parry.def)}" placeholder="Успех (или всё)" style="flex: 1; margin-right: 3px;">
                                <input type="text" id="parry-f" value="${esc(myGifs.parry.f)}" placeholder="Провал" style="flex: 1; margin-left: 3px;">
                            </div>
                            <div style="margin-top: 5px;"><label><input type="checkbox" id="parry-crit-chk" ${myGifs.parry.useCrit ? "checked" : ""}> <i>Критические броски?</i></label></div>
                            <div id="parry-crit-box" style="display: none; margin-top: 5px; padding-left: 10px;">
                                <div style="display: flex; align-items: center; margin-bottom: 3px;"><label style="flex: 0 0 80px; color: green;">Успех:</label><input type="text" id="parry-cs" value="${esc(myGifs.parry.cs)}" placeholder="Опционально" style="flex: 1;"></div>
                                <div style="display: flex; align-items: center;"><label style="flex: 0 0 80px; color: red;">Провал:</label><input type="text" id="parry-cf" value="${esc(myGifs.parry.cf)}" placeholder="Опционально" style="flex: 1;"></div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 5px; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 5px; border-left: 4px solid #000066;">
                        <label style="font-weight: bold; color: #000066; cursor: pointer; display: flex; align-items: center;">
                            <input type="checkbox" id="block-en-chk" ${myGifs.block.enabled ? "checked" : ""}> 
                            <i class="fas fa-chess-rook" style="margin-left:5px; margin-right:3px;"></i> Есть Блок? ${testBtnHtml('block')}
                        </label>
                        <div id="block-main-box" style="display: none; margin-top: 5px;">
                            <div style="display: flex;">
                                <input type="text" id="block-def" value="${esc(myGifs.block.def)}" placeholder="Успех (или всё)" style="flex: 1; margin-right: 3px;">
                                <input type="text" id="block-f" value="${esc(myGifs.block.f)}" placeholder="Провал" style="flex: 1; margin-left: 3px;">
                            </div>
                            <div style="margin-top: 5px;"><label><input type="checkbox" id="block-crit-chk" ${myGifs.block.useCrit ? "checked" : ""}> <i>Критические броски?</i></label></div>
                            <div id="block-crit-box" style="display: none; margin-top: 5px; padding-left: 10px;">
                                <div style="display: flex; align-items: center; margin-bottom: 3px;"><label style="flex: 0 0 80px; color: green;">Успех:</label><input type="text" id="block-cs" value="${esc(myGifs.block.cs)}" placeholder="Опционально" style="flex: 1;"></div>
                                <div style="display: flex; align-items: center;"><label style="flex: 0 0 80px; color: red;">Провал:</label><input type="text" id="block-cf" value="${esc(myGifs.block.cf)}" placeholder="Опционально" style="flex: 1;"></div>
                            </div>
                        </div>
                    </div>`,
                    render: (dHtml) => {
                        const $d = $(dHtml);
                        const toggleBox = (chk, box) => { if($d.find(chk).prop('checked')) $d.find(box).slideDown(150); else $d.find(box).slideUp(150); };
                        
                        $d.find('#atk-crit-box').toggle($d.find('#atk-crit-chk').prop('checked'));
                        $d.find('#parry-main-box').toggle($d.find('#parry-en-chk').prop('checked'));
                        $d.find('#parry-crit-box').toggle($d.find('#parry-crit-chk').prop('checked'));
                        $d.find('#block-main-box').toggle($d.find('#block-en-chk').prop('checked'));
                        $d.find('#block-crit-box').toggle($d.find('#block-crit-chk').prop('checked'));

                        $d.find('#atk-crit-chk').change(() => toggleBox('#atk-crit-chk', '#atk-crit-box'));
                        $d.find('#parry-en-chk').change(() => toggleBox('#parry-en-chk', '#parry-main-box'));
                        $d.find('#parry-crit-chk').change(() => toggleBox('#parry-crit-chk', '#parry-crit-box'));
                        $d.find('#block-en-chk').change(() => toggleBox('#block-en-chk', '#block-main-box'));
                        $d.find('#block-crit-chk').change(() => toggleBox('#block-crit-chk', '#block-crit-box'));

                        // Обработчик тестов для оружия
                        $d.find('.grr-test-btn').click(function(e) {
                            e.preventDefault();
                            const section = $(this).data('section');
                            const sectionTitle = section === 'atk' ? "(Атака)" : section === 'parry' ? "(Парирование)" : "(Блок)";
                            const urls = {
                                def: $d.find(`#${section}-def`).val(),
                                f: $d.find(`#${section}-f`).val(),
                                cs: $d.find(`#${section}-cs`).val(),
                                cf: $d.find(`#${section}-cf`).val(),
                                useCrit: $d.find(`#${section}-crit-chk`).prop('checked')
                            };
                            GRR_Shared.openTestModal(`${weaponNameText} ${sectionTitle}`, urls);
                        });
                    },
                    buttons: {
                        save: {
                            icon: '<i class="fas fa-save"></i>', label: "Сохранить",
                            callback: async (dHtml) => {
                                const $d = $(dHtml);
                                const updatedGifs = foundry.utils.mergeObject(allWpnGifs, {
                                    [weaponNameText]: { 
                                        atk: { def: $d.find('#atk-def').val().trim(), f: $d.find('#atk-f').val().trim(), cs: $d.find('#atk-cs').val().trim(), cf: $d.find('#atk-cf').val().trim(), useCrit: $d.find('#atk-crit-chk').prop('checked') },
                                        parry: { enabled: $d.find('#parry-en-chk').prop('checked'), def: $d.find('#parry-def').val().trim(), f: $d.find('#parry-f').val().trim(), cs: $d.find('#parry-cs').val().trim(), cf: $d.find('#parry-cf').val().trim(), useCrit: $d.find('#parry-crit-chk').prop('checked') },
                                        block: { enabled: $d.find('#block-en-chk').prop('checked'), def: $d.find('#block-def').val().trim(), f: $d.find('#block-f').val().trim(), cs: $d.find('#block-cs').val().trim(), cf: $d.find('#block-cf').val().trim(), useCrit: $d.find('#block-crit-chk').prop('checked') }
                                    }
                                });
                                await (game.actors.get(actor.id) ?? actor).setFlag(MODULE_ID, "weapons", updatedGifs);
                            }
                        }
                    },
                    default: "save"
                }, { width: 450 }).render(true);
            });
        });
    });
})();