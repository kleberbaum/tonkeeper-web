/*
 * Minimal Telegram-WebApp mock so the prebuilt TWA 3.20.2 bundle can boot in an
 * ordinary desktop browser (outside Telegram). It:
 *   1. injects launch params (tgWebAppData / platform / theme) into the URL hash
 *      BEFORE the app bundle reads them, and
 *   2. answers the events the bundle sends (viewport / theme / CloudStorage)
 *      via window.Telegram.WebView.receiveEvent + a postMessage fallback.
 *
 * Storage is empty by default -> the app lands on its onboarding/import screen.
 * This is a DEV-ONLY preview shim; it is never part of any deployed bundle.
 */
(function () {
    var THEME = {
        bg_color: '#10161f',
        text_color: '#ffffff',
        hint_color: '#8994a3',
        link_color: '#45aef5',
        button_color: '#45aef5',
        button_text_color: '#ffffff',
        secondary_bg_color: '#1d2633',
        header_bg_color: '#10161f',
        accent_text_color: '#45aef5',
        section_bg_color: '#10161f',
        subtitle_text_color: '#8994a3',
        destructive_text_color: '#ff4766'
    };

    // 1) Launch params -> URL hash (the SDK reads window.location.hash at init).
    if (!location.hash || location.hash.indexOf('tgWebAppData') === -1) {
        var initData =
            'user=' +
            encodeURIComponent(
                JSON.stringify({
                    id: 1,
                    first_name: 'Dev',
                    username: 'dev',
                    language_code: 'en'
                })
            ) +
            '&auth_date=1700000000&hash=devhash';
        var params =
            'tgWebAppData=' +
            encodeURIComponent(initData) +
            '&tgWebAppVersion=7.2' +
            '&tgWebAppPlatform=tdesktop' +
            '&tgWebAppThemeParams=' +
            encodeURIComponent(JSON.stringify(THEME));
        location.hash = '#' + params;
    }

    // 2) Event delivery back into the app (both known channels, to be safe).
    function emit(type, data) {
        try {
            if (window.Telegram && window.Telegram.WebView && window.Telegram.WebView.receiveEvent) {
                window.Telegram.WebView.receiveEvent(type, data);
            }
        } catch (e) {
            /* ignore */
        }
        try {
            window.dispatchEvent(
                new MessageEvent('message', {
                    data: JSON.stringify({ eventType: type, eventData: data })
                })
            );
        } catch (e) {
            /* ignore */
        }
    }

    function handleCustomMethod(d) {
        var reqId = d.req_id;
        var method = d.method;
        var p = d.params || {};
        var result;
        // Empty CloudStorage -> the app shows the fresh/onboarding state.
        if (method === 'getStorageValues') {
            result = {};
            (p.keys || []).forEach(function (k) {
                result[k] = '';
            });
        } else if (method === 'getStorageKeys') {
            result = [];
        } else if (method === 'saveStorageValue' || method === 'deleteStorageValues') {
            result = true;
        } else {
            result = '';
        }
        emit('custom_method_invoked', { req_id: reqId, result: result });
    }

    function postEvent(type, raw) {
        var data = {};
        try {
            data = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {};
        } catch (e) {
            /* ignore */
        }
        switch (type) {
            case 'web_app_request_viewport':
                setTimeout(function () {
                    emit('viewport_changed', {
                        height: window.innerHeight,
                        width: window.innerWidth,
                        is_expanded: true,
                        is_state_stable: true
                    });
                }, 0);
                break;
            case 'web_app_request_theme':
                setTimeout(function () {
                    emit('theme_changed', { theme_params: THEME });
                }, 0);
                break;
            case 'web_app_invoke_custom_method':
                setTimeout(function () {
                    handleCustomMethod(data);
                }, 0);
                break;
            default:
                // setup_back_button, set_header_color, web_app_ready, expand, etc.
                // are fire-and-forget for a preview; nothing to answer.
                break;
        }
    }

    window.TelegramWebviewProxy = { postEvent: postEvent };
    // Some SDK paths look for window.external.notify too.
    try {
        window.external = window.external || {};
        window.external.notify = function (json) {
            try {
                var m = JSON.parse(json);
                postEvent(m.eventType, m.eventData);
            } catch (e) {
                /* ignore */
            }
        };
    } catch (e) {
        /* ignore */
    }

    // eslint-disable-next-line no-console
    console.info('[tg-mock] Telegram WebApp env mocked (platform=tdesktop, empty CloudStorage)');
})();
