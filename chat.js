(() => {
    const MODULE_ID = "gurps-roll-reactions";

    Hooks.on("renderChatMessage", async (message, html, data) => {
        if (game.system.id !== "gurps") return;
        const $html = html instanceof jQuery ? html : $(html);
        if ($html.find('.gga-chat-message').length === 0) return;

        let actor = game.actors.get(message.speaker?.actor);
        if (!actor && message.speaker?.token) {
            const token = canvas.tokens?.get(message.speaker.token);
            if (token) actor = game.actors.get(token.document.actorId);
        }
        if (!actor) return; 

        const allText = $html.text().replace(/\s+/g, ' ').trim();
        const cleanText = $html.text().replace(/[\s\n\r\-!.,_]+/g, '').toLowerCase();

        // --- ДЕТЕКТОРЫ БРОСКОВ ---
        let isCritSuccess = (cleanText.includes("крит") && cleanText.includes("успех")) || cleanText.includes("criticalsuccess");
        let isCritFail = (cleanText.includes("крит") && (cleanText.includes("провал") || cleanText.includes("неудач"))) || cleanText.includes("criticalfailure");
        
        let isFail = cleanText.includes("неудач") || cleanText.includes("провал") || cleanText.includes("промах") || $html.find('.failure, [class*="fail"], .bad, [class*="bad"]').length > 0;

        if ($html.find('[class*="crit"], [class*="critical"]').length > 0) {
            if ($html.find('.success, [class*="success"]').length > 0) isCritSuccess = true;
            if (isFail) isCritFail = true;
        }

        if (isCritSuccess && isCritFail) {
            if (isFail) isCritSuccess = false; 
            else isCritFail = false;
        }

        // --- ЕДИНЫЙ ПУЛ ТРИГГЕРОВ ---
        const wpnGifs = actor.getFlag(MODULE_ID, "weapons") || {};
        const skillGifs = actor.getFlag(MODULE_ID, "skills") || {};
        const univGifs = actor.getFlag(MODULE_ID, "universal") || {};

        let allTriggers = [];
        
        for (const [k, v] of Object.entries(wpnGifs)) if (k.trim()) allTriggers.push({ name: k, data: v, type: 'weapon' });
        for (const [k, v] of Object.entries(skillGifs)) if (k.trim()) allTriggers.push({ name: k, data: v, type: 'simple' });
        for (const [k, v] of Object.entries(univGifs)) if (k.trim()) allTriggers.push({ name: k, data: v, type: 'simple' });

        allTriggers.sort((a, b) => b.name.length - a.name.length);

        let matchedTrigger = null;
        for (const trigger of allTriggers) {
            if (allText.includes(trigger.name)) {
                matchedTrigger = trigger;
                break;
            }
        }

        if (!matchedTrigger) return;

        let finalMediaUrl = "";

        // --- КАСКАДНАЯ ЛОГИКА ВЫВОДА ---
        if (matchedTrigger.type === 'weapon') {
            const wData = matchedTrigger.data;
            const isParry = cleanText.includes("parry:") || cleanText.includes("парир") || cleanText.includes("p:") || cleanText.includes("р:"); 
            const isBlock = cleanText.includes("block:") || cleanText.includes("блок");

            let activeBlock = wData.atk; 
            if (isParry && wData.parry.enabled) activeBlock = wData.parry;
            else if (isBlock && wData.block.enabled) activeBlock = wData.block;
            else if ((isParry && !wData.parry.enabled) || (isBlock && !wData.block.enabled)) return; 

            finalMediaUrl = activeBlock.def; 
            if (isFail && activeBlock.f) finalMediaUrl = activeBlock.f; 
            
            if (activeBlock.useCrit) { 
                if (isCritSuccess && activeBlock.cs) finalMediaUrl = activeBlock.cs;
                if (isCritFail && activeBlock.cf) finalMediaUrl = activeBlock.cf;
            }
        } else {
            const gifData = matchedTrigger.data;
            finalMediaUrl = gifData.defaultGif; 
            if (isFail && gifData.failGif) finalMediaUrl = gifData.failGif;
            if (isCritSuccess && gifData.critSuccessGif) finalMediaUrl = gifData.critSuccessGif;
            if (isCritFail && gifData.critFailGif) finalMediaUrl = gifData.critFailGif;
        }

        if (!finalMediaUrl) return;

        // --- РЕНДЕР ---
        const enableGlow = game.settings.get(MODULE_ID, "enableGlow");
        const borderStyle = GRR_Shared.calculateBorderStyle(enableGlow, isCritSuccess, isCritFail);
        $html.find('.message-content').first().append(GRR_Shared.buildMediaHTML(finalMediaUrl, borderStyle));
    });
})();