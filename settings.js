(() => {
    const MODULE_ID = "gurps-roll-reactions";

    Hooks.once("init", () => {
        game.settings.register(MODULE_ID, "enableGlow", {
            name: "Свечение при критических бросках",
            hint: "Включает зеленую и красную рамки вокруг картинок при критических бросках. Настройка индивидуальна для каждого игрока.",
            scope: "client", 
            config: true,
            type: Boolean,
            default: true
        });

        game.settings.registerMenu(MODULE_ID, "clearCacheMenu", {
            name: "Очистка базы данных медиа",
            label: "Очистить кэш картинок",
            hint: "Удаляет ВСЕ сохраненные картинки и триггеры у ВСЕХ персонажей.",
            icon: "fas fa-trash-alt",
            type: class GurpsMediaClearCache extends FormApplication {
                render() {
                    new Dialog({
                        title: "Полная очистка медиа-кэша",
                        content: `<p style="color: darkred; font-weight: bold;">ВНИМАНИЕ!</p>
                                  <p>Вы собираетесь удалить абсолютно все настроенные картинки и гифки у всех персонажей.</p>
                                  <p>Это действие необратимо. Продолжить?</p>`,
                        buttons: {
                            yes: {
                                icon: '<i class="fas fa-trash"></i>',
                                label: "Удалить всё",
                                callback: async () => {
                                    let count = 0;
                                    for (let actor of game.actors) {
                                        let updated = false;
                                        if (actor.getFlag(MODULE_ID, "skills")) { await actor.unsetFlag(MODULE_ID, "skills"); updated = true; }
                                        if (actor.getFlag(MODULE_ID, "universal")) { await actor.unsetFlag(MODULE_ID, "universal"); updated = true; }
                                        if (actor.getFlag(MODULE_ID, "weapons")) { await actor.unsetFlag(MODULE_ID, "weapons"); updated = true; }
                                        if (updated) count++;
                                    }
                                    ui.notifications.info(`Кэш медиа полностью очищен! Затронуто персонажей: ${count}`);
                                }
                            },
                            no: { icon: '<i class="fas fa-times"></i>', label: "Отмена" }
                        },
                        default: "no"
                    }).render(true);
                }
            },
            restricted: true 
        });
    });
})();