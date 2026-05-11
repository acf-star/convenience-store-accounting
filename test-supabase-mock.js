// Mock Supabase SDK for testing
(function(global) {
  'use strict';

  function makeQueryBuilder(table) {
    const getData = () => (global.__mockDB && global.__mockDB[table]) || [];
    let _filters = [];
    let _order = null;
    let _single = false;

    const builder = {
      select() { return builder; },
      single() { _single = true; return builder; },
      order(col, opts) { _order = { col, asc: opts && opts.ascending !== undefined ? opts.ascending : true }; return builder; },
      eq(col, val) { _filters.push(function(r) { return r[col] === val; }); return builder; },
      neq(col, val) { _filters.push(function(r) { return r[col] !== val; }); return builder; },
      not() { return builder; },
      insert(rows) {
        var arr = Array.isArray(rows) ? rows : [rows];
        var db = getData();
        arr.forEach(function(row) { db.push(JSON.parse(JSON.stringify(row))); });
        builder._inserted = arr;
        return builder;
      },
      upsert(rows) {
        var arr = Array.isArray(rows) ? rows : [rows];
        var db = getData();
        arr.forEach(function(row) {
          var idx = db.findIndex(function(r) { return r.id === row.id; });
          if (idx >= 0) db[idx] = JSON.parse(JSON.stringify(row));
          else db.push(JSON.parse(JSON.stringify(row)));
        });
        builder._upserted = arr;
        return builder;
      },
      update(updates) {
        builder._updates = updates;
        return builder;
      },
      delete() {
        builder._delete = true;
        return builder;
      },
      then(resolve) {
        try {
          var result = getData().map(function(r) { return JSON.parse(JSON.stringify(r)); });
          _filters.forEach(function(f) { result = result.filter(f); });

          if (builder._delete) {
            var db = getData();
            result.forEach(function(item) {
              var idx = db.findIndex(function(r) { return r.id === item.id; });
              if (idx >= 0) db.splice(idx, 1);
            });
            return resolve({ data: null, error: null });
          }

          if (builder._updates) {
            var db2 = getData();
            result.forEach(function(item) {
              var idx = db2.findIndex(function(r) { return r.id === item.id; });
              if (idx >= 0) Object.assign(db2[idx], builder._updates);
            });
            return resolve({ data: _single ? result[0] : result, error: null });
          }

          if (builder._inserted) {
            return resolve({ data: _single ? builder._inserted[0] : builder._inserted, error: null });
          }

          if (builder._upserted) {
            return resolve({ data: _single ? builder._upserted[0] : builder._upserted, error: null });
          }

          if (_order) {
            result.sort(function(a, b) {
              var va = a[_order.col], vb = b[_order.col];
              var cmp = va < vb ? -1 : va > vb ? 1 : 0;
              return _order.asc ? cmp : -cmp;
            });
          }

          return resolve({ data: _single ? (result[0] || null) : result, error: null });
        } catch (e) {
          return resolve({ data: null, error: e });
        }
      }
    };
    builder[Symbol.toStringTag] = 'Promise';
    return builder;
  }

  var mockAuth = {
    getSession: function() {
      return Promise.resolve({ data: { session: { user: { email: 'test@test.com' } } } });
    },
    signInWithPassword: function() {
      return Promise.resolve({ data: { session: {} }, error: null });
    },
    signOut: function() {
      return Promise.resolve();
    }
  };

  global.supabase = {
    createClient: function() {
      return {
        from: function(table) { return makeQueryBuilder(table); },
        auth: mockAuth
      };
    }
  };

})(typeof window !== 'undefined' ? window : global);
