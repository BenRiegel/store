// module: store.js
// author: Ben Riegel
// overview: declares and exports the Store class. The constructor takes an
// object that is used to create a new state object. Accessor properties are
// then created for getting and setting the state properties. The class also
// contains methods for registering and removing an update listener, setting
// the notification order for an action, and setting the state.


//----- imports ----------------------------------------------------------------

import State from './state.js';


//----- export code block ------------------------------------------------------

export default class Store{

  //----- private code block -----

  #state;
  #listeners;
  #notificationOrders;

  //creates getters and setters for each property name of the state object
  //so it's possible to evaluate the expression store.stateVar
  #createAccessors(obj){
    this.#state.getKeys().forEach(varName => {
      Object.defineProperty(this, varName, {
        get: function() {
               return this.#state.getVar(varName);
             },
        set: function(value){
               this.#state.setVar(varName, value);
             },
      });
    });
  }

  //----- public api -----

  constructor(initValue){
    this.#state = new State(initValue);
    this.#listeners = {};
    this.#notificationOrders = {};
    this.#createAccessors();
  }

  registerUpdateListener( {type, callback} ){
    if (this.#listeners[type]){
      this.#listeners[type].push(callback);
    } else {
      this.#listeners[type] = [callback];
    }
  }

  removeUpdateListener( {type, callback} ){
    if (this.#listeners[type]){
      let listenersList = this.#listeners[type];
      let filteredList = listenersList.filter( listener => {
        return (listener !== callback);
      });
      this.#listeners[type] = filteredList;
    }
  }

  setNotificationOrder(action, notificationOrder){
    this.#notificationOrders[action] = notificationOrder;
  }

  //iife used here so that the function notify is only in the scope of the
  //return function
  setState = (function(){
    async function notify(changeSummary, action){
      let notificationOrder = this.#notificationOrders[action];
      notificationOrder = notificationOrder || Object.keys(this.#listeners);
      for (let listenerKey of notificationOrder){
        let listenerList = this.#listeners[listenerKey];
        for (let listener of listenerList){
          await listener(changeSummary, action);
        }
      }
    }
    return async function(action, newPartialState){
      const results = this.#state.set(newPartialState);
      await notify.call(this, results, action);
    }
  })()

}
