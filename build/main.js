var chartTypes = ['scatterplot', 'line', 'area', 'bar', 'horizontal-bar', 'stacked-bar', 'horizontal-stacked-bar'];
var pluginsList = ['tooltip', 'legend', 'quick-filter', 'trendline'];

var configs = [{
    data: 'Comets',
    type: 'scatterplot',
    x: 'Discovery Date',
    y: ['PHA', 'q (AU)'],
    color: 'Orbit Class',
    size: 'period (yr)',
    plugins: ['tooltip', 'legend']
}, {
    data: 'WorldBank',
    type: 'scatterplot',
    x: 'Adolescent fertility rate (births per 1,000 women ages 15-19)',
    y: 'Internet users (per 100 people)',
    color: 'Region',
    size: null,
    plugins: ['tooltip', 'legend', 'trendline']
}, {
    data: 'EnglishPremierLeague',
    type: 'line',
    x: 'Year',
    y: 'Points',
    color: 'Position',
    size: null,
    plugins: ['tooltip', 'legend']
}, {
    data: 'EnglishPremierLeague',
    type: 'scatterplot',
    x: 'Year',
    y: 'Points',
    color: 'Club',
    size: null,
    plugins: ['tooltip', 'legend']
}, {
    data: 'EnglishPremierLeague',
    type: 'stacked-bar',
    x: 'Club',
    y: 'Points',
    color: 'Club',
    size: null,
    plugins: ['tooltip']
}];

var toggleArray = function (array, value) {
    var index = array.indexOf(value);
    index === -1 ? array.push(value) : array.splice(index, 1);
    return array;
};

var randomFromArray = function (array) {
    return array[Math.floor(Math.random() * array.length)];
};

var App = React.createClass({
    getInitialState: function () {
        return { config: this.getConfigByNumber(0) };
    },
    getConfigByNumber: function (n) {
        return _.clone(this.props.configs[n]);
    },
    render: function () {
        return React.createElement(
            'section',
            { className: 'editor' },
            React.createElement(NavButtons, { updateConfig: this.updateConfig, randomConfig: this.getRandomConfig,
                getConfigByNumber: this.getConfigByNumber, maxConfig: this.props.configs.length }),
            React.createElement(
                'div',
                { className: 'code', id: 'code' },
                React.createElement(ChartConfig, { config: this.state.config, datasets: this.props.datasets,
                    replaceDataset: this.replaceDataset, updateConfig: this.updateConfig })
            ),
            React.createElement('div', { className: 'error', id: 'error' }),
            React.createElement('div', { className: 'chart', id: 'chart' })
        );
    },
    renderChart: function () {
        try {
            this.chart = new tauCharts.Chart(this.prepareConfig(this.state.config));
            this.chart.renderTo('#chart');
        } catch (err) {

            document.getElementById('error').classList.add('show');
            document.getElementById('error').innerHTML = err;
        }
    },
    componentDidMount: function () {
        this.renderChart();
    },
    componentDidUpdate: function () {
        this.chart.destroy();
        document.getElementById('chart').innerHTML = '';
        document.getElementById('error').innerHTML = '';
        document.getElementById('error').classList.remove('show');

        this.renderChart();
    },
    prepareConfig: function (config) {

        var clone = _.clone(config);
        clone.data = this.props.datasets[config.data];
        //clone.guide = {interpolate: 'cardinal'};

        clone.plugins = config.plugins.map(function (field) {
            return tauCharts.api.plugins.get(field)();
        });

        return clone;
    },
    findConfig: function (name) {
        return _.find(this.props.configs, function (config) {
            return config.data === name;
        });
    },
    replaceDataset: function (newDataset) {
        var config = _.clone(this.findConfig(newDataset));
        this.setState({
            config: config
        });
    },
    updateConfig: function (changes) {
        var config = this.state.config;

        if (config['x'] === changes['y']) {
            config['x'] = config['y'];
        }

        if (config['y'] === changes['x']) {
            config['y'] = config['x'];
        }

        for (var attr in changes) {
            config[attr] = changes[attr];
            //intersection to save plugins order
        }

        this.setState({
            config: config
        });
    },
    getRandomConfig: function () {

        var categorical = {
            Comets: ['PHA', 'Orbit Class'],
            WorldBank: ['Country Name', 'Income Group', 'Region'],
            EnglishPremierLeague: ['Club', 'Position', 'Season']
        };

        var dates = {
            Comets: 'Discovery Date',
            WorldBank: null,
            EnglishPremierLeague: 'Year'
        };

        var chartTypes = ['scatterplot', 'scatterplot', 'scatterplot', 'line', 'bar'];
        var pluginsList = ['tooltip', 'legend', 'trendline'];

        var config = {};

        config.data = this.state.config.data;

        config.x = randomFromArray(_.keys(datasets[config.data][0]));
        config.y = randomFromArray(_.keys(datasets[config.data][0]));

        config.x = Math.random() > 0.8 ? [randomFromArray(_.filter(categorical[config.data], function (p) {
            return p !== 'Country Name';
        })), config.x] : config.x;
        config.y = Math.random() > 0.8 ? [randomFromArray(_.filter(categorical[config.data], function (p) {
            return p !== 'Country Name';
        })), config.y] : config.y;

        config.size = Math.random() > 0.7 ? null : randomFromArray(_.keys(datasets[config.data][0]));
        config.color = randomFromArray(categorical[config.data]);
        config.plugins = pluginsList;

        config.type = randomFromArray(chartTypes);
        if (config.x[0] === dates[config.data]) {
            config.type = 'line';
        };

        return config;
    }
});

var SelectPropertyLink = React.createClass({
    render: function () {

        var value = _.isNull(this.props.value) && 'null' || this.props.value;
        var apost = (this.props.type === 'string' || this.props.type === 'array') && this.props.name !== 'data' ? ['\'', '\''] : ['', ''];

        return React.createElement(
            'span',
            null,
            React.createElement(
                'a',
                {
                    href: 'javascript: void 0' },
                apost[0],
                value,
                apost[1]
            ),
            this.props.isNotLast ? ', ' : null
        );
    }
});

var DropDownMenu = React.createClass({

    getInitialState: function () {
        return {
            checked: this.getValue()
        };
    },

    getValue: function () {
        return !_.isArray(this.props.value) ? [this.props.value] : this.props.value;
    },

    render: function () {

        var name = this.props.name;
        var options = this.props.options;
        var maxChecked = this.props.maxChecked;
        var self = this;

        var list = options.map(function (item, i) {
            var isChecked = self.state.checked.indexOf(item) > -1 ? 'checked' : null;
            return React.createElement(
                'li',
                { key: i, className: isChecked },
                React.createElement(
                    'a',
                    { href: 'javascript: void 0', onClick: self.handleClick, 'data-name': name, 'data-value': item,
                        'data-maxchecked': '1' },
                    item
                ),
                maxChecked > 1 && !isChecked ? React.createElement(
                    'a',
                    { href: 'javascript: void 0', onClick: self.handleClick, 'data-name': name, 'data-value': item,
                        'data-maxchecked': maxChecked, className: 'add' },
                    ' '
                ) : null
            );
        });

        return React.createElement(
            'ul',
            { className: 'menu' },
            list
        );
    },
    handleClick: function (event) {

        var checked = this.state.checked;
        var minChecked = this.props.minChecked;
        var maxChecked = event.target.dataset.maxchecked;
        var value = event.target.dataset.value;
        var name = event.target.dataset.name;

        this.setState({ checked: toggleArray(checked, value) });

        var result = checked.length > maxChecked ? checked.splice(checked.length - maxChecked, checked.length - 1) : checked;

        if (result.length >= minChecked) {

            var changes = {};
            switch (result.length) {
                case 1:
                    changes[name] = result[0];
                    break;
                case 0:
                    changes[name] = null;
                    break;
                default:
                    changes[name] = result;
            }

            name === 'data' ? this.props.replaceDataset(value) : this.props.updateConfig(changes);
        }
    }
});

var PropertyLine = React.createClass({

    render: function () {

        var value = this.props.value;
        var name = this.props.name;
        var datasets = _.keys(this.props.datasets);

        var type = _.isArray(value) && 'array' || _.isString(value) && 'string' || _.isNull(value) && 'null';
        var options = name === 'type' && chartTypes || name === 'data' && datasets || this.props.options;
        var menu = this.props.menuItem === name;

        var links = React.createElement(SelectPropertyLink, { value: value, type: type, name: name });

        if (type === 'array') {
            links = value.map(function (link, i) {

                var isNotLast = !(i === value.length - 1);
                return React.createElement(SelectPropertyLink, { key: i, value: link, type: type, name: name, isNotLast: isNotLast });
            });
            links.unshift('[');
            links.push(']');
        }

        if (name === 'plugins') {
            return React.createElement(
                'dl',
                { className: name },
                React.createElement(
                    'dt',
                    null,
                    name,
                    ':'
                ),
                React.createElement(
                    'dd',
                    { className: type },
                    React.createElement(PluginsBlock, { value: value, options: options,
                        updateConfig: this.props.updateConfig })
                )
            );
        }

        return React.createElement(
            'dl',
            { className: name },
            React.createElement(
                'dt',
                null,
                name,
                ':'
            ),
            React.createElement(
                'dd',
                { className: type, onClick: this.handleClick },
                menu ? React.createElement(DropDownMenu, { value: value, options: options, name: name,
                    maxChecked: name === 'x' || name === 'y' ? 2 : 1,
                    minChecked: name === 'size' || name === 'color' ? 0 : 1,
                    replaceDataset: this.props.replaceDataset, updateConfig: this.props.updateConfig
                }) : null,
                links
            ),
            ','
        );
    },
    handleClick: function () {
        this.props.menuItem === this.props.name ? this.props.updateState(null) : this.props.updateState(this.props.name);
    }
});

var PluginLine = React.createClass({
    render: function () {

        var name = this.props.name;
        var isEnabled = this.props.isEnabled ? null : 'disabled';

        return React.createElement(
            'li',
            { className: isEnabled, onClick: this.handleClick },
            'tauCharts.api.plugins.get(',
            React.createElement(
                'a',
                { href: 'javascript: void 0' },
                '\'',
                name,
                '\''
            ),
            ')(),'
        );
    },
    handleClick: function () {
        var changes = {};
        changes.plugins = toggleArray(this.props.activePlugins, this.props.name);

        this.props.updateConfig(changes);
    }
});

var PluginsBlock = React.createClass({
    render: function () {

        var value = this.props.value;
        var self = this;
        var plugins = pluginsList.map(function (plugin, i) {

            var isEnabled = value.indexOf(plugin) > -1;

            return React.createElement(PluginLine, { key: i, name: plugin, isEnabled: isEnabled, updateConfig: self.props.updateConfig,
                activePlugins: self.props.value });
        });

        return React.createElement(
            'div',
            null,
            React.createElement(
                'p',
                null,
                '['
            ),
            React.createElement(
                'ul',
                null,
                plugins
            ),
            React.createElement(
                'p',
                null,
                ']'
            )
        );
    }
});

var ChartConfig = React.createClass({

    getInitialState: function () {
        return {
            menuItem: null
        };
    },
    render: function () {
        var config = this.props.config;
        var datasets = this.props.datasets;

        var options = Object.keys(datasets[config.data][0]).map(function (option) {
            return option;
        });
        var self = this;

        var fields = _.filter(_.keys(config), function (key) {
            return !_.isFunction(config[key]);
        }).map(function (field, i) {

            return React.createElement(PropertyLine, { key: i, name: field, value: config[field], options: options, datasets: datasets,
                menuItem: self.state.menuItem, updateState: self.updateState,
                replaceDataset: self.props.replaceDataset, updateConfig: self.props.updateConfig });
        });

        return React.createElement(
            'div',
            null,
            React.createElement(
                'p',
                null,
                React.createElement(
                    'em',
                    null,
                    'var'
                ),
                ' chart ',
                React.createElement(
                    'em',
                    null,
                    '= new'
                ),
                ' tauCharts.Chart({'
            ),
            fields,
            React.createElement(
                'p',
                null,
                '});'
            ),
            React.createElement(
                'p',
                null,
                'chart.renderTo(',
                React.createElement(
                    'em',
                    null,
                    '\'#container\''
                ),
                ');'
            )
        );
    },
    updateState: function (menuItem) {
        this.setState({
            menuItem: menuItem
        });
    }
});

var NavButtons = React.createClass({
    getInitialState: function () {
        return { configNumber: 0 };
    },
    render: function () {
        return React.createElement(
            'div',
            { className: 'navigator' },
            React.createElement(
                'button',
                { className: 'prev', href: 'javascript: void 0', onClick: this.prevChartClick,
                    disabled: this.state.configNumber <= 0 },
                '«'
            ),
            React.createElement(
                'button',
                { className: 'next', href: 'javascript: void 0', onClick: this.nextChartClick,
                    disabled: this.state.configNumber >= this.props.maxConfig - 1 },
                'Next example »'
            ),
            React.createElement(
                'button',
                { className: 'lucky', href: 'javascript: void 0', onClick: this.luckyClick },
                'I’m lucky!'
            )
        );
    },
    nextChartClick: function () {
        this.state.configNumber++;
        this.props.updateConfig(this.props.getConfigByNumber(this.state.configNumber));
    },
    prevChartClick: function () {
        this.state.configNumber--;
        this.props.updateConfig(this.props.getConfigByNumber(this.state.configNumber));
    },
    luckyClick: function () {
        this.props.updateConfig(this.props.randomConfig());
    }
});

ReactDOM.render(React.createElement(App, { configs: configs, datasets: datasets }), document.getElementById('container'));