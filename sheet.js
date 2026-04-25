(() => {
  const MODULE_ID = GRR_Shared.MODULE_ID;
  const esc = GRR_Shared.escapeHTML;
  const encodeKey = GRR_Shared.encodeKey;
  const loc = GRR_Shared.loc;
  const fmt = GRR_Shared.fmt;

  const testBtnHtml = (section) => `
        <a class="grr-test-btn" title="${loc("GRR.sheet.testReaction")}" data-section="${section}" style="color: #555; margin-left: 8px; cursor: pointer; transition: color 0.2s; font-size: 1.1em;"><i class="fas fa-dice"></i></a>
    `;

  const WEAPON_SECTIONS = [
    { id: 'atk', color: '#8b0000', labelColor: '#660000', icon: 'fa-fist-raised', labelKey: 'GRR.sheet.weapon.attack', hasEnable: false },
    { id: 'parry', color: '#006600', labelColor: '#004400', icon: 'fa-shield-alt', labelKey: 'GRR.sheet.weapon.hasParry', hasEnable: true },
    { id: 'block', color: '#000066', labelColor: '#000066', icon: 'fa-chess-rook', labelKey: 'GRR.sheet.weapon.hasBlock', hasEnable: true },
  ];

  const buildWeaponSection = (cfg, data) => {
    const { id, color, labelColor, icon, labelKey, hasEnable } = cfg;
    const header = hasEnable
      ? `<label style="font-weight: bold; color: ${labelColor}; cursor: pointer; display: flex; align-items: center;">
                   <input type="checkbox" id="${id}-en-chk" ${data.enabled ? "checked" : ""}>
                   <i class="fas ${icon}" style="margin-left:5px; margin-right:3px;"></i> ${loc(labelKey)} ${testBtnHtml(id)}
               </label>`
      : `<b style="color: ${labelColor}; display: flex; align-items: center;"><i class="fas ${icon}" style="margin-right: 5px;"></i> ${loc(labelKey)} ${testBtnHtml(id)}</b>`;
    const inputs = `
            <div style="display: flex; margin-top: 5px;">
                <input type="text" id="${id}-def" value="${esc(data.defaultGif)}" placeholder="${loc("GRR.sheet.weapon.successPlaceholder")}" style="flex: 1; margin-right: 3px;">
                <input type="text" id="${id}-f"   value="${esc(data.failGif)}"    placeholder="${loc("GRR.sheet.weapon.failPlaceholder")}"    style="flex: 1; margin-left: 3px;">
            </div>
            <div style="margin-top: 5px;"><label><input type="checkbox" id="${id}-crit-chk" ${data.useCrit ? "checked" : ""}> <i>${loc("GRR.sheet.weapon.criticals")}</i></label></div>
            <div id="${id}-crit-box" style="display: none; margin-top: 5px; padding-left: 10px;">
                <div style="display: flex; align-items: center; margin-bottom: 3px;"><label style="flex: 0 0 80px; color: green;">${loc("GRR.sheet.result.success")}</label><input type="text" id="${id}-cs" value="${esc(data.critSuccessGif)}" placeholder="${loc("GRR.common.optional")}" style="flex: 1;"></div>
                <div style="display: flex; align-items: center;">                  <label style="flex: 0 0 80px; color: red;">${loc("GRR.sheet.result.fail")}</label>  <input type="text" id="${id}-cf" value="${esc(data.critFailGif)}"    placeholder="${loc("GRR.common.optional")}" style="flex: 1;"></div>
            </div>`;
    return `
            <div style="margin-bottom: 15px; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 5px; border-left: 4px solid ${color};">
                ${header}
                ${hasEnable ? `<div id="${id}-main-box" style="display: none; margin-top: 5px;">${inputs}</div>` : inputs}
            </div>`;
  };

  Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
    if (game.system.id !== "gurps") return;
    buttons.unshift({ label: loc("GRR.sheet.button"), class: "gurps-media-btn", icon: "fas fa-film", onclick: () => openMediaManager(sheet.actor) });
  });

  function buildUniversalRow(trigger, urls) {
    return `
        <div class="gurps-media-row" style="border: 1px solid #777; padding: 8px; margin-bottom: 8px; border-radius: 5px; background: rgba(0,0,0,0.05); transition: background 0.2s;">
            <div style="display: flex; margin-bottom: 5px; align-items: center;">
                <b style="flex: 0 0 100px;">${loc("GRR.sheet.triggerLabel")}</b>
                <input type="text" class="trigger-name" value="${esc(GRR_Shared.decodeKey(trigger))}" placeholder="${loc("GRR.sheet.triggerPlaceholder")}" style="flex: 1;">
                ${testBtnHtml('universal')}
                <a class="remove-media-btn" style="color: darkred; margin-left: 10px; cursor: pointer;" title="${loc("GRR.common.delete")}"><i class="fas fa-trash"></i></a>
            </div>
            <div style="display: flex; margin-bottom: 3px; align-items: center;"><label style="flex: 0 0 100px;">${loc("GRR.sheet.result.default")}</label><input type="text" class="trigger-def" value="${esc(urls.defaultGif)}" placeholder="${loc("GRR.sheet.result.defaultHint")}" style="flex: 1;"></div>
            <div style="display: flex; margin-bottom: 3px; align-items: center;"><label style="flex: 0 0 100px; color: #b85c00;">${loc("GRR.sheet.result.fail")}</label><input type="text" class="trigger-f" value="${esc(urls.failGif)}" placeholder="${loc("GRR.common.optional")}" style="flex: 1;"></div>
            <div style="display: flex; margin-bottom: 3px; align-items: center;"><label style="flex: 0 0 100px; color: green;">${loc("GRR.sheet.result.critSuccess")}</label><input type="text" class="trigger-cs" value="${esc(urls.critSuccessGif)}" placeholder="${loc("GRR.common.optional")}" style="flex: 1;"></div>
            <div style="display: flex; margin-bottom: 3px; align-items: center;"><label style="flex: 0 0 100px; color: red;">${loc("GRR.sheet.result.critFail")}</label><input type="text" class="trigger-cf" value="${esc(urls.critFailGif)}" placeholder="${loc("GRR.common.optional")}" style="flex: 1;"></div>
        </div>`;
  }

  function openMediaManager(actor) {
    const currentFlags = actor.getFlag(MODULE_ID, "universal") || {};
    let rowsHtml = "";
    for (const [trigger, urls] of Object.entries(currentFlags)) rowsHtml += buildUniversalRow(trigger, urls);

    const dlg = new Dialog({
      title: fmt("GRR.sheet.universalTitle", { name: actor.name }),
      content: `
                <div style="margin-bottom: 10px;"><p style="font-size: 0.9em; color: #444;">${loc("GRR.sheet.universalDesc")}</p></div>
                <div id="gurps-media-list" style="max-height: 400px; overflow-y: auto; padding-right: 5px; margin-bottom: 10px;">${rowsHtml}</div>
                <div style="text-align: center; margin-bottom: 10px;"><button id="add-gurps-media"><i class="fas fa-plus"></i> ${loc("GRR.common.add")}</button></div>
                <div id="grr-io-panel" style="border-top: 1px solid #ccc; margin-top: 5px; padding-top: 8px; display: flex; gap: 8px; justify-content: flex-end;">
                    <input type="file" id="grr-import-file" accept=".json" style="display:none;">
                    <button id="grr-export-btn"><i class="fas fa-file-export"></i> ${loc("GRR.io.export")}</button>
                    <button id="grr-import-btn"><i class="fas fa-file-import"></i> ${loc("GRR.io.import")}</button>
                </div>
            `,
      render: (html) => {
        const $html = $(html);
        $html.find('#add-gurps-media').click((e) => { e.preventDefault(); $html.find('#gurps-media-list').append(buildUniversalRow("", {})); });
        $html.on('click', '.remove-media-btn', function (e) { e.preventDefault(); $(this).closest('.gurps-media-row').fadeOut(200, function () { $(this).remove(); }); });

        $html.on('click', '.grr-test-btn', function (e) {
          e.preventDefault();
          const row = $(this).closest('.gurps-media-row');
          const title = row.find('.trigger-name').val() || loc("GRR.common.unnamed");
          const urls = {
            def: row.find('.trigger-def').val(),
            f: row.find('.trigger-f').val(),
            cs: row.find('.trigger-cs').val(),
            cf: row.find('.trigger-cf').val()
          };
          GRR_Shared.openTestModal(title, urls);
        });

        const $importFile = $html.find('#grr-import-file');

        $html.find('#grr-export-btn').click((e) => {
          e.preventDefault();
          GRR_Shared.exportActorReactions(actor);
        });

        $html.find('#grr-import-btn').click((e) => {
          e.preventDefault();
          $importFile.trigger('click');
        });

        $importFile.on('change', async function () {
          const file = this.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.skills && !data.weapons && !data.universal) {
              ui.notifications.error(loc("GRR.io.importInvalid"));
              return;
            }
            await GRR_Shared.importActorReactions(actor, data);
            ui.notifications.info(fmt("GRR.io.importSuccess", { name: actor.name }));
            dlg.close();
            openMediaManager(actor);
          } catch (_err) {
            ui.notifications.error(loc("GRR.io.importError"));
          }
        });

        const $ioPanel = $html.find('#grr-io-panel').detach();
        const $dialogButtons = $(dlg.element).find('.dialog-buttons');
        if ($dialogButtons.length) $dialogButtons.after($ioPanel);
        else $html.append($ioPanel);
      },
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>', label: loc("GRR.common.save"),
          callback: async (html) => {
            const newFlags = {};
            $(html).find('.gurps-media-row').each(function () {
              const trigger = $(this).find('.trigger-name').val().trim();
              if (trigger) newFlags[encodeKey(trigger)] = { defaultGif: $(this).find('.trigger-def').val().trim(), failGif: $(this).find('.trigger-f').val().trim(), critSuccessGif: $(this).find('.trigger-cs').val().trim(), critFailGif: $(this).find('.trigger-cf').val().trim() };
            });
            const payload = {};
            for (let oldKey of Object.keys(currentFlags)) if (!newFlags.hasOwnProperty(oldKey)) payload[`-=${oldKey}`] = null;
            Object.assign(payload, newFlags);
            if (Object.keys(payload).length > 0) await GRR_Shared.resolveActor(actor).setFlag(MODULE_ID, "universal", payload);
          }
        }
      },
      default: "save"
    }, { width: 550, resizable: true });
    dlg.render(true);
  }

  // --- SKILL AND WEAPON ICONS ---
  Hooks.on("renderActorSheet", (app, html) => {
    if (game.system.id !== "gurps") return;
    const actor = app.actor;
    const $html = $(html);

    // Skills
    $html.find('div[data-key^="system.skills"], div[data-key^="system.spells"]').each((_index, element) => {
      const descDiv = $(element).find('.gga-line-description');
      if (descDiv.find('.gurps-gif-settings-btn').length > 0) return;
      const $skillTooltip = descDiv.find('.tooltip').clone();
      $skillTooltip.children().remove();
      const skillNameText = $skillTooltip.text().trim();
      if (!skillNameText) return;

      const btn = $(`<a class="gurps-gif-settings-btn" title="${loc("GRR.sheet.skill.tooltip")}" style="margin-left: 8px; color: #8b0000; cursor: pointer; flex-shrink: 0; transition: all 0.2s;"><i class="fas fa-image"></i></a>`);
      const dataKey = $(element).attr('data-key');
      const skillData = foundry.utils.getProperty(actor, dataKey);
      const skillLevel = skillData?.level ?? 10;

      btn.click(async (e) => {
        e.preventDefault(); e.stopPropagation();
        const allSkillGifs = actor.getFlag(MODULE_ID, "skills") || {};
        const myGifs = allSkillGifs[encodeKey(skillNameText)] || {};

        new Dialog({
          title: loc("GRR.sheet.skill.title"),
          content: `
                        <div style="margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                            <span>${loc("GRR.sheet.skill.label")} <b>${esc(skillNameText)}</b></span>
                            ${testBtnHtml('skill')}
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 5px;"><label style="flex: 1;">${loc("GRR.sheet.result.default")}</label><input type="text" id="gif-def" value="${esc(myGifs.defaultGif)}" style="flex: 2;"></div>
                        <div style="display: flex; align-items: center; margin-bottom: 10px;"><label style="flex: 1; color: #b85c00;">${loc("GRR.sheet.result.fail")}</label><input type="text" id="gif-f" value="${esc(myGifs.failGif)}" placeholder="${loc("GRR.common.optional")}" style="flex: 2;"></div>
                        <div style="display: flex; align-items: center; margin-bottom: 5px;"><label style="flex: 1; color: green;">${loc("GRR.sheet.result.critSuccess")}</label><input type="text" id="gif-cs" value="${esc(myGifs.critSuccessGif)}" placeholder="${loc("GRR.common.optional")}" style="flex: 2;"></div>
                        <div style="display: flex; align-items: center; margin-bottom: 15px;"><label style="flex: 1; color: red;">${loc("GRR.sheet.result.critFail")}</label><input type="text" id="gif-cf" value="${esc(myGifs.critFailGif)}" placeholder="${loc("GRR.common.optional")}" style="flex: 2;"></div>
                    `,
          render: (dHtml) => {
            $(dHtml).find('.grr-test-btn').click(function (e) {
              e.preventDefault();
              GRR_Shared.openTestModal(skillNameText, {
                def: $(dHtml).find('#gif-def').val(), f: $(dHtml).find('#gif-f').val(), cs: $(dHtml).find('#gif-cs').val(), cf: $(dHtml).find('#gif-cf').val()
              }, skillLevel);
            });
          },
          buttons: {
            save: {
              icon: '<i class="fas fa-save"></i>', label: loc("GRR.common.save"),
              callback: async (dHtml) => {
                const updatedGifs = { ...allSkillGifs, [encodeKey(skillNameText)]: { defaultGif: $(dHtml).find('#gif-def').val().trim(), failGif: $(dHtml).find('#gif-f').val().trim(), critSuccessGif: $(dHtml).find('#gif-cs').val().trim(), critFailGif: $(dHtml).find('#gif-cf').val().trim() } };
                await GRR_Shared.resolveActor(actor).setFlag(MODULE_ID, "skills", updatedGifs);
              }
            }
          },
          default: "save"
        }).render(true);
      });
      descDiv.append(btn);
    });

    // Weapons
    $html.find('.meleedraggable, .rangeddraggable, div[data-key^="system.melee"], div[data-key^="system.ranged"]').each((_index, element) => {
      const descDiv = $(element).find('.desc').first();
      if (!descDiv.length || descDiv.find('.gurps-wpn-settings-btn').length > 0) return;
      const $wpnTooltip = descDiv.find('.tooltip').first().clone();
      $wpnTooltip.children().remove();
      const weaponNameText = $wpnTooltip.text().trim();
      if (!weaponNameText) return;

      const btn = $(`<a class="gurps-wpn-settings-btn" title="${loc("GRR.sheet.weapon.tooltip")}" style="margin-left: 6px; color: #1e4a8b; font-size: 1.1em; cursor: pointer; flex-shrink: 0; transition: all 0.2s;"><i class="fas fa-khanda"></i></a>`);
      descDiv.find('.tooltip').first().after(btn);

      btn.click(async (e) => {
        e.preventDefault(); e.stopPropagation();
        const allWpnGifs = actor.getFlag(MODULE_ID, "weapons") || {};
        const defaultStructure = { atk: { defaultGif: "", failGif: "", critSuccessGif: "", critFailGif: "", useCrit: false }, parry: { enabled: false, defaultGif: "", failGif: "", critSuccessGif: "", critFailGif: "", useCrit: false }, block: { enabled: false, defaultGif: "", failGif: "", critSuccessGif: "", critFailGif: "", useCrit: false } };
        const myGifs = foundry.utils.mergeObject(defaultStructure, allWpnGifs[encodeKey(weaponNameText)] || {});

        new Dialog({
          title: loc("GRR.sheet.weapon.title"),
          content: `
                    <div style="margin-bottom: 10px; text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 5px;"><b>${esc(weaponNameText)}</b></div>
                    ${WEAPON_SECTIONS.map(cfg => buildWeaponSection(cfg, myGifs[cfg.id])).join('')}`,
          render: (dHtml) => {
            const $d = $(dHtml);
            const toggleBox = (chk, box) => { if ($d.find(chk).prop('checked')) $d.find(box).slideDown(150); else $d.find(box).slideUp(150); };

            for (const { id, hasEnable } of WEAPON_SECTIONS) {
              if (hasEnable) {
                $d.find(`#${id}-main-box`).toggle($d.find(`#${id}-en-chk`).prop('checked'));
                $d.find(`#${id}-en-chk`).change(() => toggleBox(`#${id}-en-chk`, `#${id}-main-box`));
              }
              $d.find(`#${id}-crit-box`).toggle($d.find(`#${id}-crit-chk`).prop('checked'));
              $d.find(`#${id}-crit-chk`).change(() => toggleBox(`#${id}-crit-chk`, `#${id}-crit-box`));
            }

            $d.find('.grr-test-btn').click(function (e) {
              e.preventDefault();
              const section = $(this).data('section');
              const sectionTitle = loc(`GRR.sheet.weapon.section.${section}`);
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
              icon: '<i class="fas fa-save"></i>', label: loc("GRR.common.save"),
              callback: async (dHtml) => {
                const $d = $(dHtml);
                const sections = {};
                for (const { id, hasEnable } of WEAPON_SECTIONS) {
                  const entry = {
                    defaultGif: $d.find(`#${id}-def`).val().trim(),
                    failGif: $d.find(`#${id}-f`).val().trim(),
                    critSuccessGif: $d.find(`#${id}-cs`).val().trim(),
                    critFailGif: $d.find(`#${id}-cf`).val().trim(),
                    useCrit: $d.find(`#${id}-crit-chk`).prop('checked'),
                  };
                  if (hasEnable) entry.enabled = $d.find(`#${id}-en-chk`).prop('checked');
                  sections[id] = entry;
                }
                const updatedGifs = { ...allWpnGifs, [encodeKey(weaponNameText)]: sections };
                await GRR_Shared.resolveActor(actor).setFlag(MODULE_ID, "weapons", updatedGifs);
              }
            }
          },
          default: "save"
        }, { width: 450 }).render(true);
      });
    });
  });
})();
