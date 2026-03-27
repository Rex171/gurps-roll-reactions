/**
 * GURPS Roll Reactions - Shared Logic & Smart Test Modal
 * Совместимость: Foundry VTT V13
 */

window.GRR_Shared = {
    MODULE_ID: "gurps-roll-reactions",

    escapeHTML: (str) => {
        if (!str || typeof str !== 'string') return "";
        if (str.includes('<') && str.includes('>')) {
            return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        }
        return str.replace(/"/g, "&quot;");
    },

    buildMediaHTML: (url, borderStyle) => {
        return `
            <div class="gurps-skill-media-wrapper" style="margin-top: 8px; border-top: 1px dashed #999; padding-top: 5px; text-align: center;">
                <img src="${GRR_Shared.escapeHTML(url)}" style="max-width: 100%; height: auto; border-radius: 6px; ${borderStyle}" alt="Реакция не загрузилась">
            </div>
        `;
    },

    calculateBorderStyle: (glowEnabled, isCS, isCF) => {
        const baseStyle = "border: 2px solid #222; box-shadow: 0 0 5px rgba(0,0,0,0.5);";
        if (!glowEnabled) return baseStyle;
        if (isCS) return "border: 2px solid #008000; box-shadow: 0 0 15px rgba(0, 255, 0, 0.8);";
        if (isCF) return "border: 2px solid #8b0000; box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);";
        return baseStyle;
    },

    openTestModal: (title, urls, skillLevel = 10) => {
        const content = `
            <div style="text-align: center; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-around; margin-bottom: 15px; background: rgba(0,0,0,0.03); padding: 10px; border-radius: 5px;">
                    <div>
                        <label style="font-weight: bold; font-size: 0.9em;">Уровень навыка:</label><br>
                        <input type="number" id="grr-test-skill" value="${skillLevel}" style="width: 70px; text-align: center; margin-top: 5px;">
                    </div>
                    <div>
                        <label style="font-weight: bold; font-size: 0.9em;">Бросок кубиков:</label><br>
                        <input type="number" id="grr-test-roll" value="10" min="3" max="18" style="width: 70px; text-align: center; margin-top: 5px;">
                    </div>
                </div>
                <button id="grr-roll-btn" style="background: #e3d3b9; border: 1px solid #7a633f; font-weight: bold;">
                    <i class="fas fa-dice"></i> Показать
                </button>
            </div>
            <div id="grr-preview-area" style="min-height: 120px; display: flex; align-items: center; justify-content: center; border: 1px dashed #999; border-radius: 5px; padding: 10px; margin-top: 10px;">
                <span style="color: #777; font-style: italic;">Введите значения и нажмите кнопку</span>
            </div>
        `;

        new Dialog({
            title: `Тест: ${title}`,
            content: content,
            render: (html) => {
                html.find('#grr-roll-btn').click(() => {
                    const skill = parseInt(html.find('#grr-test-skill').val()) || 10;
                    const roll = parseInt(html.find('#grr-test-roll').val()) || 10;
                    
                    let isCritSuccess = false;
                    let isCritFail = false;
                    
                    // Официальная математика критов GURPS
                    if (roll <= 4) isCritSuccess = true;
                    else if (roll === 5 && skill >= 15) isCritSuccess = true;
                    else if (roll === 6 && skill >= 16) isCritSuccess = true;
                    else if (roll === 18) isCritFail = true;
                    else if (roll === 17 && skill <= 15) isCritFail = true;
                    else if (roll - skill >= 10) isCritFail = true;

                    const isSuccess = (roll <= skill) && !isCritFail;
                    const isFail = (roll > skill) && !isCritSuccess;

                    // Логика каскадного фоллбэка
                    let finalUrl = urls.def;
                    if (isFail && urls.f) finalUrl = urls.f;
                    if (urls.useCrit !== false) {
                        if (isCritSuccess && urls.cs) finalUrl = urls.cs;
                        if (isCritFail && urls.cf) finalUrl = urls.cf;
                    }

                    // Формирование текста результата
                    let resText = isCritSuccess ? "<b style='color:green; font-size:1.1em;'>Критический Успех!</b>" : 
                                  isCritFail ? "<b style='color:red; font-size:1.1em;'>Критический Провал!</b>" :
                                  isSuccess ? "<b style='color:#004400;'>Успех</b>" : "<b style='color:#b85c00;'>Провал</b>";

                    const glow = game.settings.get(GRR_Shared.MODULE_ID, "enableGlow");
                    const border = GRR_Shared.calculateBorderStyle(glow, isCritSuccess, isCritFail);
                    
                    let previewHtml = `<div style="text-align: center; width: 100%;">
                        <div style="margin-bottom: 8px; font-size: 1.1em;">Результат: ${resText} <span style="font-size: 0.8em; color: #555;">(Бросок: ${roll})</span></div>`;
                    
                    if (finalUrl) {
                        previewHtml += `<img src="${GRR_Shared.escapeHTML(finalUrl)}" style="max-width: 100%; height: auto; border-radius: 6px; ${border}">`;
                    } else {
                        previewHtml += `<span style="color: #990000;">Для этого результата реакция не задана.</span>`;
                    }
                    previewHtml += `</div>`;

                    html.find('#grr-preview-area').html(previewHtml);
                });
            },
            buttons: { close: { label: "Закрыть" } },
            default: "close"
        }, { width: 380 }).render(true);
    }
};