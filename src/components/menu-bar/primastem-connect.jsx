import React from 'react';
import PropTypes from 'prop-types';
import VM from 'scratch-vm';

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
                title={connected ? 'PrimaSTEM: connected (click to disconnect)' : 'PrimaSTEM: connect robot'}
                onMouseEnter={() => this.setState({hover: true})}
                onMouseLeave={() => this.setState({hover: false})}
                onClick={this.handleClick}
            >
                <span role="img" aria-label="robot">{'🤖'}</span>
                <span style={dot} />
                <span>{connected ? 'Robot' : 'Connect robot'}</span>
            </div>
        );
    }
}

PrimastemConnect.propTypes = {
    vm: PropTypes.instanceOf(VM).isRequired
};

export default PrimastemConnect;
