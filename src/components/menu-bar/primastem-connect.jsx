import React from 'react';
import PropTypes from 'prop-types';
import {injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';

/**
 * Self-contained translations for the connect button. Keyed by the language part
 * of the GUI locale (e.g. "pt-br" -> "pt"). Falls back to English. Kept here rather
 * than in the scratch-l10n catalogs to avoid touching the upstream message pipeline.
 */
const STRINGS = {
    connect: {
        en: 'Connect robot', ru: 'Подключить робота', fr: 'Connecter le robot',
        de: 'Roboter verbinden', es: 'Conectar robot', it: 'Collega robot',
        pt: 'Conectar robô', nl: 'Robot verbinden', pl: 'Połącz robota',
        uk: 'Підключити робота'
    },
    connected: {
        en: 'Robot', ru: 'Робот', fr: 'Robot', de: 'Roboter', es: 'Robot',
        it: 'Robot', pt: 'Robô', nl: 'Robot', pl: 'Robot', uk: 'Робот'
    },
    titleConnect: {
        en: 'PrimaSTEM: connect robot', ru: 'PrimaSTEM: подключить робота',
        fr: 'PrimaSTEM : connecter le robot', de: 'PrimaSTEM: Roboter verbinden',
        es: 'PrimaSTEM: conectar robot', it: 'PrimaSTEM: collega robot',
        pt: 'PrimaSTEM: conectar robô', nl: 'PrimaSTEM: robot verbinden',
        pl: 'PrimaSTEM: połącz robota', uk: 'PrimaSTEM: підключити робота'
    },
    titleConnected: {
        en: 'PrimaSTEM: connected (click to disconnect)',
        ru: 'PrimaSTEM: подключён (нажмите, чтобы отключить)',
        fr: 'PrimaSTEM : connecté (cliquez pour déconnecter)',
        de: 'PrimaSTEM: verbunden (zum Trennen klicken)',
        es: 'PrimaSTEM: conectado (clic para desconectar)',
        it: 'PrimaSTEM: connesso (clic per disconnettere)',
        pt: 'PrimaSTEM: conectado (clique para desconectar)',
        nl: 'PrimaSTEM: verbonden (klik om te verbreken)',
        pl: 'PrimaSTEM: połączono (kliknij, aby rozłączyć)',
        uk: 'PrimaSTEM: підключено (натисніть, щоб відключити)'
    }
};

const tr = (key, locale) => {
    const lang = (locale || 'en').toLowerCase().split('-')[0];
    const table = STRINGS[key];
    return table[lang] || table.en;
};

/**
 * Menu-bar button to connect/disconnect the PrimaSTEM robot.
 * Visible only when the PrimaSTEM extension is loaded. The click is a real user
 * gesture, so the extension's navigator.bluetooth.requestDevice() is allowed.
 */
class PrimastemConnect extends React.Component {
    constructor (props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.refresh = this.refresh.bind(this);
        this.state = {loaded: false, connected: false, hover: false};
    }
    componentDidMount () {
        this._timer = setInterval(this.refresh, 700);
        this.refresh();
    }
    componentWillUnmount () {
        clearInterval(this._timer);
    }
    call (op) {
        const rt = this.props.vm && this.props.vm.runtime;
        if (!rt) return undefined;
        const fn = (rt.getOpcodeFunction && rt.getOpcodeFunction(`primastem_${op}`)) ||
            (rt._primitives && rt._primitives[`primastem_${op}`]);
        return fn ? fn({}, {}) : undefined;
    }
    refresh () {
        const vm = this.props.vm;
        const loaded = !!(vm && vm.extensionManager && vm.extensionManager.isExtensionLoaded &&
            vm.extensionManager.isExtensionLoaded('primastem'));
        let connected = false;
        if (loaded) {
            try {
                connected = !!this.call('isConnected');
            } catch (e) {
                connected = false;
            }
        }
        if (loaded !== this.state.loaded || connected !== this.state.connected) {
            this.setState({loaded, connected});
        }
    }
    handleClick () {
        if (this.state.connected) {
            this.call('disconnect');
        } else {
            // requestDevice must run inside this user gesture
            const r = this.call('connect');
            if (r && typeof r.then === 'function') r.then(this.refresh, this.refresh);
        }
        setTimeout(this.refresh, 300);
    }
    render () {
        if (!this.state.loaded) return null;
        const connected = this.state.connected;
        const locale = this.props.intl && this.props.intl.locale;
        const wrap = {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '100%',
            padding: '0 12px',
            cursor: 'pointer',
            color: 'white',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            background: this.state.hover ? 'rgba(0, 0, 0, 0.15)' : 'transparent'
        };
        const dot = {
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            background: connected ? '#3fdc7a' : '#ffd23f',
            boxShadow: '0 0 0 2px rgba(255,255,255,0.35)'
        };
        return (
            <div
                style={wrap}
                title={connected ? tr('titleConnected', locale) : tr('titleConnect', locale)}
                onMouseEnter={() => this.setState({hover: true})}
                onMouseLeave={() => this.setState({hover: false})}
                onClick={this.handleClick}
            >
                <span role="img" aria-label="ladybug">{'🐞'}</span>
                <span style={dot} />
                <span>{connected ? tr('connected', locale) : tr('connect', locale)}</span>
            </div>
        );
    }
}

PrimastemConnect.propTypes = {
    intl: intlShape,
    vm: PropTypes.instanceOf(VM).isRequired
};

export default injectIntl(PrimastemConnect);
