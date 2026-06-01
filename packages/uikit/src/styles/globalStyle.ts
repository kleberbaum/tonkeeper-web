import styled, { createGlobalStyle, css } from 'styled-components';

export const GlobalStyleCss = css`
    body {
        margin: 0;
        font-family: Montserrat, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background-color: ${props => props.theme.backgroundContent};
        color: ${props => props.theme.textPrimary};
        overflow-y: scroll;
    }

    :root {
        --app-height: 100vh;
        --app-width: 100vw;
    }

    html.is-locked {
        height: calc(var(--app-height) - 1px);
    }

    html.is-locked,
    html.is-locked body,
    html.is-locked #root {
        /* want to block all overflowing content */
        overflow: hidden;

        /* want to exclude padding from the height */
        box-sizing: border-box;
    }

    html.hidden,
    html.hidden body,
    html.hidden #root {
        overflow: hidden;
        -webkit-overflow-scrolling: touch;
    }

    html.no-user-select {
        * {
            user-select: none;
        }
    }

    .disable-hover {
        pointer-events: none;
    }

    input::-webkit-strong-password-auto-fill-button {
        display: none !important;
    }

    input::-webkit-contacts-auto-fill-button,
    input::-webkit-credentials-auto-fill-button {
        visibility: hidden;
        position: absolute;
        right: 0;
    }

    /*
     * Hide native scrollbars on every scroll surface — page body, the
     * mobile-app body id, the desktop content wrappers, and the notification
     * modal's overlay + inner dialog. Was previously gated to .win32/.linux
     * because macOS Electron used to inherit nice overlay scrollbars from the
     * OS; in practice (macOS "Always show scrollbars" + Chrome / Firefox
     * across all OSes) it leaves a chunky persistent bar that doesn't match
     * the dark theme. Consistency across platforms wins.
     *
     * The body { overflow-y: scroll } rule above still reserves the gutter
     * so the page never shifts when content grows past the viewport; this
     * just hides the visible track.
     */
    body,
    #body,
    .full-size-wrapper,
    .notification-overlay,
    .dialog-content,
    .hide-scrollbar {
        scrollbar-width: none; /* Firefox / non-WebKit */
    }

    body::-webkit-scrollbar,
    #body::-webkit-scrollbar,
    .full-size-wrapper::-webkit-scrollbar,
    .notification-overlay::-webkit-scrollbar,
    .dialog-content::-webkit-scrollbar,
    .hide-scrollbar::-webkit-scrollbar {
        width: 0;
        height: 0;
    }

    .pointer-events-none {
        pointer-events: none;
    }
`;

export const GlobalStyle = createGlobalStyle`
  ${GlobalStyleCss}
`;

export const Container = styled.div`
    min-width: 300px;
    max-width: 550px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    min-height: var(--app-height);
    background-color: ${props => props.theme.backgroundPage};
    white-space: pre-wrap;
`;

export const Body = styled.div`
    flex-grow: 1;
    padding: 0 1rem;
`;
