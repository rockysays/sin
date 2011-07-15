String.prototype.padL = function(width,pad) 
{     
  if (!width ||width<1)         
    return this;         
   
  if (!pad) pad=" ";             
   
  var length = width - this.length     
   
  if (length < 1)  
    return this.substr(0,width);      
   
  return (String.repeat(pad,length) + this).substr(0,width);     
}     
String.prototype.padR = function(width,pad) 
{     
   if (!width || width<1)         
     return this;              
    
   if (!pad) pad=" ";     
     
   var length = width - this.length     
    
   if (length < 1) this.substr(0,width);      
     return (this + String.repeat(pad,length)).substr(0,width); 
};

String.repeat = function(chr,count) 
{         
  var str = "";      
  for(var x=0;x<count;x++)  
  { 
    str += chr 
  };      
  return str; 
};

Date.prototype.formatDate = function(format) 
{     
  var date = this;     
  if (!format)       
    format="MM/dd/yyyy";                     
  var month = date.getMonth() + 1;     
  var year = date.getFullYear();          
  format = format.replace("MM",month.toString().padL(2,"0"));    
             
  if (format.indexOf("yyyy") > -1)         
    format = format.replace("yyyy",year.toString());     
  else if (format.indexOf("yy") > -1)         
    format = format.replace("yy",year.toString().substr(2,2));      
   
  format = format.replace("dd",date.getDate().toString().padL(2,"0"));      
  var hours = date.getHours();            
   
  if (format.indexOf("t") > -1)     
  {        
    if (hours > 11)         
      format = format.replace("t","pm")        
    else         
      format = format.replace("t","am")     
  }     
   
  if (format.indexOf("HH") > -1)         
    format = format.replace("HH",hours.toString().padL(2,"0"));     
   
  if (format.indexOf("hh") > -1)  
  {         
    if (hours > 12) hours - 12;         
    if (hours == 0) hours = 12;        
    format = format.replace("hh",hours.toString().padL(2,"0"));             
  }     
   
  if (format.indexOf("mm") > -1)        
    format = format.replace("mm",date.getMinutes().toString().padL(2,"0"));     
   
  if (format.indexOf("ss") > -1)        
    format = format.replace("ss",date.getSeconds().toString().padL(2,"0"));     
   
  return format; 
};

$(function() {
  window._void = function(){};

  window.ContentColumnModel = Backbone.Model.extend({
  });

  window.ContentFacetParamModel = Backbone.Model.extend({
  });

  window.ContentFacetModel = Backbone.Model.extend({
  });

  window.ContentColumnCollection = Backbone.Collection.extend({
    model: ContentColumnModel
  });

  window.ContentFacetParamCollection = Backbone.Collection.extend({
    model: ContentFacetParamModel
  });

  window.ContentFacetCollection = Backbone.Collection.extend({
    model: ContentFacetModel
  });

  window.ContentStoreModel = Backbone.Model.extend({
    defaults: {
    },

    updateWithNewConfig: function() {
      var me = this;
      // console.log(this.get('config'));
      var columns = new ContentColumnCollection;
      var config = eval('('+this.get('config')+')');
      var table = config['table'];
      if (table) {
        _.each(table.columns, function(col) {
          col['parentModel'] = me;
          var column = new ContentColumnModel(col);
          var view = new ContentColumnView({model: column});
          columns.add(column);
        });
      }

      this.set({
        newColumn: new ContentColumnView({model: new ContentColumnModel({add: true, parentModel: me})}).model
      });

      var facets = new ContentFacetCollection;
      _.each(config.facets, function(obj) {
        obj['parentModel'] = me;
        var facet = new ContentFacetModel(obj);
        var params = new ContentFacetParamCollection;
        _.each(obj.params, function(param) {
          param['parentModel'] = facet;
          var p = new ContentFacetParamModel(param);
          var pv = new ContentFacetParamView({model: p});
          params.add(p);
        });
        facet.set({
          params: params
        });
        var view = new ContentFacetView({model: facet});
        facets.add(facet);
      });

      this.set({
        newFacet: new ContentFacetView({model: new ContentFacetModel({add: true, parentModel: me})}).model
      });


      this.set({
        columns: columns,
        facets: facets
      });
    },

    initialize: function() {
      _.bindAll(this, 'read', 'create', 'update', 'updateWithNewConfig');
      ContentStoreModel.__super__.initialize.call(this);
      this.updateWithNewConfig();
    },

    read: function() {
    },

    create: function () {
    },

    update: function () {
    }
  });

  window.ContentStoreCollection = Backbone.Collection.extend({
    model: ContentStoreModel,
    url: '/store/stores/'
  });

  var validateColumn = function(col) {
    var res = {ok: true, msg: 'good'};

    if (!col.name) {
      res.ok = false;
      res.msg = 'Name is required.';
    }

    return res;
  };

  var validateFacet = function(obj) {
    var res = {ok: true, msg: 'good'};

    if (!obj.name) {
      res.ok = false;
      res.msg = 'Name is required.';
    }

    return res;
  };


  window.ContentColumnView = Backbone.View.extend({
    template: $('#content-column-tmpl').html(),

    className: 'content-column-item',

    events: {
      'change .multi': 'multiChanged',
      'change .type': 'typeChanged',
      'click .edit': 'showEditor',
      'click .cancel-edit-column': 'showEditor',
      'click .remove': 'removeMe',
      'click .save-column': 'saveColumn',
      'mouseout': 'mouseOut',
      'mouseover': 'mouseOver'
    },

    initialize: function() {
      _.bindAll(this, 'mouseOut', 'mouseOver', 'showEditor', 'typeChanged', 'multiChanged', 'removeMe', 'saveColumn', 'render');
      this.model.bind('change', this.render);
      this.model.view = this;
    },

    mouseOut: function() {
      this.$('.cell .op').hide();
    },

    mouseOver: function() {
      this.$('.cell .op').show();
    },

    multiChanged: function() {
      if (this.$('.multi').val() == 'true') {
        if ($.trim(this.$('.delimiter').val()) == '') {
          this.$('.delimiter').val(',');
        }
        this.$('.delimiter-container').show();
      }
      else {
        this.$('.delimiter-container').hide();
      }
    },

    removeMe: function() {
      this.model.get('parentModel').get('columns').remove(this.model);
      $(this.el).detach();
    },

    saveColumn: function() {
      var el = $(this.el);
      var obj = {
        name: el.find('.name').val(),
        type: el.find('.type').val(),
        from: el.find('.from').val(),
        delimiter: el.find('.delimiter').val(),
        index: el.find('.index').val(),
        multi: el.find('.multi').val(),
        store: el.find('.store').val(),
        termvector: el.find('.termvector').val()
      };

      switch(obj.type) {
        case 'text':
          obj.index = 'ANALYZED';
          obj.multi = 'false';
          obj.store = 'NO';
          obj.termvector = 'NO';
          break;
      }

      if (obj.multi != 'true') {
        obj.delimiter = '';
      }

      var res = validateColumn(obj);
      if (!res.ok) {
        alert(res.msg);
        return;
      }
      this.model.set(obj);
      this.render();
    },

    showEditor: function() {
      this.$('.editor').toggle();
    },

    typeChanged: function() {
      switch (this.$('.type').val()) {
        case 'text':
          this.$('.multi-container').hide();
          break;
        default:
          this.$('.multi-container').show();
          break;
      }
    },

    render: function() {
      $(this.el).html($.mustache(this.template, this.model.toJSON()));
      this.$('.index').val(this.model.get('index'));
      this.$('.delimiter').val(this.model.get('delimiter'));
      this.$('.multi').val(this.model.get('multi')).change();
      this.$('.type').val(this.model.get('type')).change();
      this.$('.store').val(this.model.get('store'));
      this.$('.termvector').val(this.model.get('termvector'));

      return this;
    }
  });

  window.ContentFacetParamView = Backbone.View.extend({
    template: $('#content-facet-param-tmpl').html(),

    className: 'content-facet-param-item',

    events: {
      'click .remove-param': 'removeMe',
      'click .param-edit': 'showEditor',
    },

    initialize: function() {
      _.bindAll(this, 'showEditor', 'removeMe', 'render');
      this.model.view = this;
    },

    removeMe: function() {
      this.model.get('parentModel').get('params').remove(this.model);
      $(this.el).detach();
    },

    showEditor: function() {
      this.$('.param-editor').toggle();
    },

    render: function() {
      $(this.el).html($.mustache(this.template, this.model.toJSON()));
      return this;
    }
  });

  var validateParam = function(param) {
    var res = {ok: true, msg: 'good'};

    if (!param.name) {
      res.ok = false;
      res.msg = 'Name is required.';
    }

    return res;
  };

  window.ContentFacetView = Backbone.View.extend({
    template: $('#content-facet-tmpl').html(),

    className: 'content-facet-item',

    events: {
      'change .type': 'typeChanged',
      'click .edit': 'showEditor',
      'click .cancel-edit-facet': 'showEditor',
      'click .remove': 'removeMe',
      'click .add-param': 'addParam',
      'click .save-facet': 'saveFacet',
      'mouseout': 'mouseOut',
      'mouseover': 'mouseOver'
    },

    initialize: function() {
      _.bindAll(this, 'mouseOut', 'mouseOver', 'showEditor', 'typeChanged', 'removeMe', 'saveFacet', 'render', 'addParam');
      this.model.view = this;
    },

    mouseOut: function() {
      this.$('.cell .op').hide();
    },

    mouseOver: function() {
      this.$('.cell .op').show();
    },

    removeMe: function() {
      this.model.get('parentModel').get('facets').remove(this.model);
      $(this.el).detach();
    },

    saveFacet: function() {
      var el = $(this.el);
      var obj = {
        name: el.find('.name').val(),
        type: el.find('.type').val(),
        depends: el.find('.depends').val(),
        dynamic: el.find('.dynamic').val(),
      };

      var res = validateFacet(obj);
      if (!res.ok) {
        alert(res.msg);
        return;
      }
      this.model.set(obj);
      this.model.get('parentModel').view.updateConfig();
      this.render();
    },

    typeChanged: function() {
      switch (this.$('.type').val()) {
        case 'path':
        case 'range':
          this.$('.params-container').show();
          break;
        default:
          this.$('.params-container').hide();
          break;
      }
    },

    addParam: function() {
      var obj = {
        name: this.$('.add-new-param .param-name').val(),
        value: this.$('.add-new-param .param-value').val()
      };

      var res = validateParam(obj);
      if (!res.ok) {
        alert(res.msg);
        return;
      }

      obj['parentModel'] = this.model;
      var model = new ContentFacetParamModel(obj);
      var view = new ContentFacetParamView({model: model});
      if (!this.model.get('params'))
        this.model.set({'params': new ContentFacetParamCollection});
      this.model.get('params').add(model);

      var container = this.$('.facet-params');
      container.append(view.render().el);

      this.$('.add-new-param').html(this.$('.add-new-param').html());
    },

    showEditor: function() {
      this.$('.editor').toggle();
    },

    render: function() {
      $(this.el).html($.mustache(this.template, this.model.toJSON()));
      this.$('.type').val(this.model.get('type')).change();

      var container = this.$('.facet-params');
      if (this.model.get('params')) {
        this.model.get('params').each(function(obj) {
          container.append(obj.view.render().el);
        });
      }

      return this;
    }
  });

  window.ContentStoreView = Backbone.View.extend({
    template: $('#content-store-tmpl').html(),

    className: 'content-store-item',

    events:{
      'click .deleteStore': 'deleteStore',
      'click .stopStore': 'stopStore',
      'click .add-column': 'addColumn',
      'click .add-facet': 'addFacet',
      'click .manage': 'showManage',
      'click .cancel-edit-store': 'showManage',
      'click .restart': 'restart',
      'click .show-raw': 'showRaw',
      'click .save-store-raw': 'saveStoreRaw',
      'click .save-store': 'saveStore'
    },

    stopStore: function(){
      var me = this;
      var model = this.model;
      $.getJSON('/store/stop-store/'+model.get('name'),function(resp){
        if (resp.status_display)
          me.$('.status').text(resp.status_display);
        if (resp.status < 15)
          me.$('.endpoint').hide();

        if (!resp["ok"]){
          alert(resp["msg"]);
        }
        else
          alert('done');
      });
    },
    
    deleteStore: function(){
      var model = this.model;
      $.getJSON('/store/delete-store/'+model.get('name'),function(resp){
        if (resp["ok"]){
          sinView.collection.remove(model);
          $('#main-area').empty().append(sinView.render().el);
        }
        else{
          alert(resp["msg"]);
        }  
      });
    },

    initialize: function() {
      _.bindAll(this, 'showManage', 'showRaw', 'restart', 'render', 'updateConfig', 'saveStoreRaw', 'saveStore', 'stopStore', 'deleteStore', 'addColumn', 'addFacet');
      this.model.view = this;
    },

    showRaw: function() {
      this.$('.raw-container').toggle();
    },

    restart: function() {
      var me = this;
      $.getJSON('/store/restart-store/'+this.model.get('name') + '/', function(res) {
        if (res.status_display)
          me.$('.status').text(res.status_display);
        if (res.status == 15)
          me.$('.endpoint').show();

        if (!res.ok)
          alert(res.error);
        else
          alert('done');
      });
    },

    addColumn: function() {
      var addNew = this.$('.add-new-column');
      var obj = {
        name: addNew.find('.name').val(),
        type: addNew.find('.type').val(),
        from: addNew.find('.from').val(),
        delimiter: addNew.find('.delimiter').val(),
        index: addNew.find('.index').val(),
        multi: addNew.find('.multi').val(),
        store: addNew.find('.store').val(),
        termvector: addNew.find('.termvector').val()
      };

      switch(obj.type) {
        case 'text':
          obj.index = 'ANALYZED';
          obj.multi = 'false';
          obj.store = 'NO';
          obj.termvector = 'NO';
          break;
      }

      if (obj.multi != 'true') {
        obj.delimiter = '';
      }

      var res = validateColumn(obj);
      if (!res.ok) {
        alert(res.msg);
        return;
      }
      obj['parentModel'] = this.model;
      var model = new ContentColumnModel(obj);
      var view = new ContentColumnView({model: model});
      this.model.get('columns').add(model);

      var columns = this.$('.columns');
      columns.append(view.render().el);
      this.updateConfig();

      this.model.get('newColumn').view.render();
    },

    addFacet: function() {
      var addNew = this.$('.add-new-facet');
      var obj = {
        name: addNew.find('.name').val(),
        type: addNew.find('.type').val(),
        depends: addNew.find('.depends').val(),
        dynamic: addNew.find('.dynamic').val(),
      };

      var params = new ContentFacetParamCollection();
      if (this.model.get('newFacet').get('params')) {
        params = this.model.get('newFacet').get('params');
        this.model.get('newFacet').set({params: new ContentFacetParamCollection()});
      }

      switch(obj.type) {
        case 'path':
        case 'range':
          break;
        default:
          params = new ContentFacetParamCollection();
          break;
      }

      var res = validateFacet(obj);
      if (!res.ok) {
        alert(res.msg);
        return;
      }
      obj['parentModel'] = this.model;
      var model = new ContentFacetModel(obj);
      model.set({params: params});

      var view = new ContentFacetView({model: model});
      this.model.get('facets').add(model);

      var facets = this.$('.facets');
      facets.append(view.render().el);
      this.updateConfig();

      this.model.get('newFacet').view.render();
    },

    updateConfig: function() {
      var schema = {
        "facets": [],
        "table": {
          "columns": [],
          "compress-src-data": true,
          "delete-field": "",
          "src-data-store": "src_data",
          "uid": "id"
        }
      };
      this.model.get('columns').each(function(obj) {
        var col = obj.toJSON();
        col.parentModel = {};
        schema.table.columns.push(col);
      });
      this.model.get('facets').each(function(obj) {
        var facet = obj.toJSON();
        facet.parentModel = {};
        if (facet.params) {
          var tmpParams = facet.params;
          facet.params = [];
          tmpParams.each(function(param) {
            var pObj = param.toJSON();
            pObj.parentModel = {};
            facet.params.push(pObj);
          });
        }
        schema.facets.push(facet);
      });
      this.model.set({config: JSON.stringify(schema)});
      this.$('.raw').val(this.model.get('config'));
    },

    saveStoreRaw: function() {
      this.model.set({config: this.$('.raw').val()});

      this.model.updateWithNewConfig();

      this.render();

      var me = this;
      $.post('/store/update-config/'+this.model.get('name')+'/', {config: this.model.get('config')}, function(res) {
        if (!res.ok)
          alert(res.error);
        else {
          me.$('.manage-tab').hide();
        }
      }, 'json');
    },

    saveStore: function() {
      this.updateConfig();
      var me = this;
      $.post('/store/update-config/'+this.model.get('name')+'/', {config: this.model.get('config')}, function(res) {
        if (!res.ok)
          alert(res.error);
        else {
          me.$('.manage-tab').hide();
        }
      }, 'json');
    },

    showManage: function() {
      this.$('.manage-tab').toggle();
    },

    render: function() {
      var obj = this.model.toJSON();
      obj.is_running = obj.status == 15;
      obj.has_running_info = obj.running_info.numdocs >= 0;

      obj.dateToLocaleString = function(text) {
        return function(text, render) {
          return new Date(parseInt(render(text))).toLocaleString();
        }
      };
      obj.dateToString = function(text) {
        return function(text, render) {
          return new Date(parseInt(render(text))).formatDate('MM-dd-yyyy hh:mm:ss');
        }
      };

      $(this.el).html($.mustache(this.template, obj));
      this.$('.timeago').each(function(index, timeago) {
        timeago = $(timeago);
        timeago.text($.timeago(timeago.text()));
      });

      var columns = this.$('.columns');
      this.model.get('columns').each(function(obj) {
        columns.append(obj.view.render().el);
      });

      this.$('.add-new-column').empty().append(this.model.get('newColumn').view.render().el);

      var facets = this.$('.facets');
      this.model.get('facets').each(function(obj) {
        facets.append(obj.view.render().el);
      });

      this.$('.raw').val(this.model.get('config'));

      this.$('.add-new-facet').empty().append(this.model.get('newFacet').view.render().el);

      return this;
    }
  });

  var validNewStore = function(obj, nodes) {
    var res = {ok: true};
    if (obj && obj.name && obj.name.length > 0) {
      if (nodes < 1) {
        nodes = 1;
      }
      if (obj.replica > nodes) {
        res['ok'] = false;
        res['error'] = "You have only "+nodes+" nodes, cannot serve "+obj.replica+" replicas.";
      }
    }
    else {
      res['ok'] = false;
      res['error'] = "Name is required.";
    }
    return res;
  };

  window.SinView = Backbone.View.extend({
    template: $('#sin-tmpl').html(),

    events: {
      'click .show-create-new': 'showCreateNew',
      'click .new-store-add': 'addNewStore'
    },

    initialize: function() {
      _.bindAll(this, "render", 'showCreateNew', 'addNewStore');
//    this.collection.bind('add', function(){alert('change event')});
    },

    showCreateNew: function() {
      this.$('.new-store').toggle();
    },

    addNewStore: function() {
      var me = this;
      var obj = {
        name: $.trim($('.new-store-name').val()),
        replica: parseInt($.trim($('.new-store-replica').val())),
        partitions: parseInt($.trim($('.new-store-partitions').val())),
        desc: $('.new-store-desc').val()
      };
      var res = validNewStore(obj, this.options.nodes_count);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      $.post('/store/new-store/'+obj.name+'/', obj, function(res) {
        if (res.ok) {
          var store = new ContentStoreModel(res);
          me.collection.add(store, {at: 0});
          me.$('.new-store').hide();
          me.render();
        }
        else {
          alert(res.error);
        }
      }, 'json');
    },

    render: function() {
      if (!this.options.rendered) {
        $(this.el).html($.mustache(this.template, {}));
        this.options.rendered = true;
      }
      
      var replica = 2;
      if (this.options.nodes_count <= 1) {
        replica = 1;
      }
      this.$('.new-store-replica').val(replica);

      var storesContainer = this.$('.stores-container');

      this.collection.each(function(store) {
        if (!store.view) {
          var view = new ContentStoreView({
            model: store
          });
        }
        storesContainer.append(store.view.render().el);
      });

      return this;
    }
  });

  var baseSync = Backbone.sync;

  Backbone.sync = function(method, model, success, error) {
    _.bind(baseSync, this);

    var resp;

    switch (method) {
      case "read":
        if (model.read)
          resp = model.read();
        else
          return baseSync(method, model, success, error);
        break;
      case "create":
        if (model.create)
          resp = model.create();
        else
          return baseSync(method, model, success, error);
        break;
      case "update":
        if (model.update)
          resp = model.update();
        else
          return baseSync(method, model, success, error);
        break;
      case "delete":
        if (model.delete)
          resp = model.delete();
        else
          return baseSync(method, model, success, error);
        break;
    }

    if (resp) {
      success(resp);
    } else {
      error("Record not found");
    }
  };

  var SinSpace = Backbone.Router.extend({
    routes: {
      'dashboard':        'dashboard', //#dashboard
      '.*':               'index',
    },

    initialize: function() {
      _.bindAll(this, 'dashboard', 'manage');
    },

    index: function() {
      //console.log('>>> index called');
      this.dashboard();
      this.navigate('dashboard');
    },

    dashboard: function() {
      $.getJSON('/cluster/1/nodes/count/', function(res) {
        window.stores = new ContentStoreCollection;
        window.sinView = new SinView({
          collection: stores,
          nodes_count: res.count
        });
        stores.fetch({
          success: function (col, res) {
            $('#main-area').empty().append(sinView.render().el);
          },
          error: function (col, res) {
            alert('Unable to get stores from the server.');
          }
        });
      });
    },

    manage: function(id) {
    }
  });

  window.sinSpace = new SinSpace();
  Backbone.history.start();
});
