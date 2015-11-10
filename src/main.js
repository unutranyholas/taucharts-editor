var chartTypes = ['scatterplot', 'line', 'area', 'bar', 'horizontal-bar', 'stacked-bar', 'horizontal-stacked-bar'];
var pluginsList = ['tooltip', 'legend', 'quick-filter', 'trendline'];

var toggleArray = function (array, value) {

    var index = array.indexOf(value);

    if (index === -1) {
        array.push(value);
    } else {
        array.splice(index, 1);
    }

    return array;
};


var App = React.createClass({
    getInitialState: function () {
        return {config: this.getConfigByNumber(0)};
    },
    getConfigByNumber: function(n) {
        return this.props.configs[n];
    },
    render: function () {
        return (
            <section className="editor">
                <div className="code" id="code"><ChartConfig config={this.state.config} datasets={this.props.datasets} replaceDataset={this.replaceDataset} updateConfig={this.updateConfig} /></div>
                <div className="chart" id="chart"></div>
            </section>
        )
    },
    renderChart: function(){
        try {
            this.chart = new tauCharts.Chart(this.prepareConfig(this.state.config));
            this.chart.renderTo('#chart');
        } catch (err) {
            console.log(err);
        }
    },
    componentDidMount: function () {
        this.renderChart();
    },
    componentDidUpdate: function(){
        this.chart.destroy();
        document.getElementById('chart').innerHTML = '';

        this.renderChart();
    },
    prepareConfig: function (config) {

        var clone = _.clone(config);
        clone.data = datasets[config.data];

        clone.plugins = config.plugins.map(function (field) {
            return tauCharts.api.plugins.get(field)();
        });

        return clone;
    },
    findConfig: function (name) {
        return _.find(this.props.configs, function (config) {
            return config.data === name;
        })
    },
    replaceDataset: function (newDataset) {
        var config = _.clone(this.findConfig(newDataset));
        this.setState({
            config: config
        });
    },
    updateConfig: function (changes){
        var config = this.state.config;

        if (config['x'] === changes['y']) {
            config['x'] = config['y'];
        }

        if (config['y'] === changes['x']) {
            config['y'] = config['x'];
        }

        for (var attr in changes) {
            config[attr] = (attr === 'plugins') ? _.intersection(pluginsList, toggleArray(config[attr], changes[attr])) : changes[attr];
            //intersection to save plugins order
        }

        this.setState({
            config: config
        });
    }
});

var SelectPropertyLink = React.createClass({
    render: function () {

        var value = (_.isNull(this.props.value) && 'null') || this.props.value;
        var apost = ((this.props.type === 'string' || this.props.type === 'array') && this.props.name !== 'data') ? ['\'', '\''] : ['', ''];

        return (
            <span><a
                href="javascript: void 0">{apost[0]}{value}{apost[1]}</a>{(this.props.isNotLast) ? ', ' : ''}</span>
        )
    }
});


var DropDownMenu = React.createClass({

    getInitialState: function () {
        return {
            checked: this.getValue()
        }
    },

    getValue: function () {
        return (!_.isArray(this.props.value)) ? [this.props.value] : this.props.value;
    },

    render: function () {

        var name = this.props.name;
        var options = this.props.options;
        var maxChecked = this.props.maxChecked;
        var self = this;

        var list = options.map(function (item, i) {
            var isChecked = (self.state.checked.indexOf(item) > -1) ? 'checked' : '';
            return (
                <li key={i} className={isChecked}>
                    <a href="javascript: void 0" onClick={self.handleClick} data-name={name} data-value={item}
                       data-maxchecked="1">{item}</a>
                    {(maxChecked > 1 && !isChecked) ?
                        <a href="javascript: void 0" onClick={self.handleClick} data-name={name} data-value={item}
                           data-maxchecked={maxChecked} className="add">&nbsp;</a> : ''}
                </li>
            )
        });

        return (
            <ul className="menu">
                {list}
            </ul>
        )
    },
    handleClick: function (event) {

        var checked = this.state.checked;
        var minChecked = this.props.minChecked;
        var maxChecked = event.target.dataset.maxchecked;
        var value = event.target.dataset.value;
        var name = event.target.dataset.name;

        this.setState({checked: toggleArray(checked, value)});

        var result = (checked.length > maxChecked) ? checked.splice(checked.length - maxChecked, checked.length - 1) : checked;

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

            (name === 'data') ? this.props.replaceDataset(value) : this.props.updateConfig(changes);

        }
    }
});

var PropertyLine = React.createClass({

    render: function () {

        var value = this.props.value;
        var name = this.props.name;
        var type = (_.isArray(value) && 'array') || (_.isString(value) && 'string') || (_.isNull(value) && 'null');
        var options = ((name === 'type') && chartTypes) || ((name === 'data') && configs.map(function (d) {
                return d.data
            })) || this.props.options;
        var menu = (this.props.menuItem === name);

        var links = (<SelectPropertyLink value={value} type={type} name={name}/>);

        if (type === 'array') {
            links = value.map(function (link, i) {

                var isNotLast = !(i === value.length - 1)
                return (
                    <SelectPropertyLink key={i} value={link} type={type} name={name} isNotLast={isNotLast}/>
                )
            });
            links.unshift('[');
            links.push(']');
        }

        if (name === 'plugins') {
            return (
                <dl className={name}>
                    <dt>{name}:</dt>
                    <dd className={type}><PluginsBlock value={value} options={options} updateConfig={this.props.updateConfig} /></dd>
                </dl>
            )
        }

        return (
            <dl className={name}>
                <dt>{name}:</dt>
                <dd className={type} onClick={this.handleClick}>{(menu) ?
                    <DropDownMenu value={value} options={options} name={name}
                                  maxChecked={(name === 'x' || name === 'y') ? 2 : 1}
                                  minChecked={(name === 'size' || name === 'color') ? 0 : 1}
                                  replaceDataset={this.props.replaceDataset} updateConfig={this.props.updateConfig}
                    /> : ''}{links}</dd>
                ,
            </dl>

        );
    },
    handleClick: function () {
        (this.props.menuItem === this.props.name) ? this.props.updateState(null) : this.props.updateState(this.props.name);
    }
});

var PluginLine = React.createClass({
    render: function () {

        var name = this.props.name;
        var isEnabled = this.props.isEnabled ? '' : 'disabled';

        return (
            <li className={isEnabled} onClick={this.handleClick}>tauCharts.api.plugins.get(<a href="javascript: void 0">'{name}'</a>)(),
            </li>
        )
    },
    handleClick: function () {
        var changes = {};
        changes.plugins = this.props.name;

        this.props.updateConfig(changes);
    }
});

var PluginsBlock = React.createClass({
    render: function () {

        var value = this.props.value;
        var self = this;
        var plugins = pluginsList.map(function (plugin, i) {

            var isEnabled = (value.indexOf(plugin) > -1);

            return (
                <PluginLine key={i} name={plugin} isEnabled={isEnabled} updateConfig={self.props.updateConfig} />
            );
        });

        return (
            <div>
                <p>[</p>
                <ul>
                    {plugins}
                </ul>
                <p>]</p>
            </div>
        );

    }
});

var ChartConfig = React.createClass({

    getInitialState: function () {
        return {
            menuItem: null
        }
    },
    render: function () {
        var config = this.props.config;
        var datasets = this.props.datasets;

        var options = Object.keys(datasets[config.data][0]).map(function (option) {
            return option
        });
        var self = this;

        var fields = _.filter(_.keys(config), function (key) {
            return !_.isFunction(config[key])
        }).map(function (field, i) {

            return (
                <PropertyLine key={i} name={field} value={config[field]} options={options}
                              menuItem={self.state.menuItem} updateState={self.updateState} replaceDataset={self.props.replaceDataset} updateConfig={self.props.updateConfig} />
            )
        });

        return (
            <div>
                <p>&#123;</p>
                {fields}
                <p>&#125;</p>
            </div>
        )
    },
    updateState: function (menuItem) {
        this.setState({
            menuItem: menuItem
        });
    }
});


ReactDOM.render(
    <App configs={configs} datasets={datasets} />,
    document.getElementById('container')
);

