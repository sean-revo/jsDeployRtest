/**
 * @fileOverview This file defines the RevoDeployR JavaScript client libraries used to
 * interact with the publicly available RevoDeployR R Web Service APIs.
 * @author Revolution Analytics
 * @version 1.0 release
 */

/**
 * <p>
 *   This class describes the public APIs for the R Web Services. This module is
 *   intended as the primary client public interface to aid in the consumption of the R
 *   Web Services. All APIs invoke an asynchronous transaction where the response is
 *   recieved and managed within the respective callback method.
 * </p>
 * <p>
 * Typical useage: 
 * <pre>
 * var success = function(response) { // handle response success };
 * var fail = function(response) { // handle response error };
 * var callback = { success : success, failure: fail, scope : this, verbose : true };
 * // send request to create session, response in your callback
 * R.util.DeployR.createSession(callback);
 * </pre>
 *  </p>
 * <p><br/>Callback format: <a name="callback-format"></a></p>
 * <p> 
 * <ul>
 *   <li><code>success</code> - {Function} success callback</li>
 *   <li><code>failure</code>- {Function} failure callback</li>
 *   <li><code>scope</code> - {object} (Optional) callback execution scope.</li>
 *   <li><code>verbose</code> - {boolean} <code>true</code> to include the full
 *    successful sever respone, otherwise a subset of the response will be provided
 *    as defined by the this call. The default is <code>false</code>.
 *   </li>
 * </ul>    
 * </p>
 * The supported service categories within this module are defined as:
 * <p>
 * <ul>
 *  <li><code>Session Services</code> - 
 *    R sessions are created in response to explicit requests on the R Web services
 *    API such as Create Session or created implicitly to facilitate the stateless 
 *    execution of R scripts.
 *  </li>
 *  <li><code>Session Object Services</code> - 
 *    Defines the services for the mangement of Live objects in an R session.
 *  </li>
 *  <li><code>Session File Services</code> - 
 *    Defines services for the mangement of working directory files. 
 *  </li>
 *  <li><code>Repository Object Services</code> - 
 *    Defines services for the permanent store of a user's binary R objects across 
 *    diffrent R sessions.
 *  </li>
 *  <li><code>Repository File Services</code> -
 *    Defines the a permanent storeage repository services for user files. 
 *  </li>
 *  <li><code>Project Services</code> - 
 *    Defines the artifacts within a project that can be referenced within the context 
 *    of a live session for that project. 
 *  </li>
 *  <li><code>User Services</code> -
 *    Defines the diffrent user managment services involved in starting any R session
 *    within RevoDeployR.
 *  </li>
 *  <li><code>R Script Services</code> -
 *    Defines the service operations to access a collection of predefined R scripts. 
 *  </li>
 * </ul>
 * </p>
 *
 * @namespace R.util.DeployR 
 * @class DeployR
 * @public
 * @static
 * @requires R.util.DeployRTransaction, YAHOO.util.Connect, sha1.js
 * @version 1.0
 */
R.util.DeployR = function () {
   /**
    * Defines whether the global custom <code>DeployRTransaction</code> events have been 
    * subscribed to or not. Registration should only take place one time.
    * @private
    * @memberOf R.util.DeployR
    * @type boolean
    */
   _isEventReg : false,

   /**
    * Defines a URL map containing all the DeployR API resource locations for the 
    * following supported service categories:
    * <ul>
    *  <li>Session Services</li>
    *  <li>Session Object Services</li>
    *  <li>Session File Services</li>
    *  <li>Repository Object Services</li>
    *  <li>Repository File Services</li>
    *  <li>Project Services</li>
    *  <li>User Services</li>
    *  <li>R Script Services</li>
    * </ul>
    * @public
    * @memberOf R.util.DeployR
    * @constant
    * @type Object
    */
   var API_RESOURCES = { session : { create: '/r/session/create',
                                     close: '/r/session/close',
                                     ping: '/r/session/ping',
				     code: '/r/session/execute/code',
				     script: '/r/session/execute/script',
				     output: '/r/session/output',
				     history: '/r/session/history',
				     saveWorkspace: '/r/session/workspace/save',
				     saveProject: '/r/session/project/save',                        	  
				     object : { list: '/r/session/object/list',
                                                get: '/r/session/object/get', 
                                                push: '/r/session/object/push',
                                                upload: '/r/session/object/upload',
                                                remove: '/r/session/object/delete',
                                                save: '/r/session/object/save',
                                                load: '/r/session/object/load'
                                              },
                                      file : { list: '/r/session/file/list',
                                               upload: '/r/session/file/upload',
                                               download: '/r/session/file/download',
                                               remove: '/r/session/file/delete',
                                               save: '/r/session/file/save',
                                               load: '/r/session/file/load'
					      }
	                           }, // end session
                         repository : { object : { list: '/r/repository/object/list',
                                                    upload: '/r/repository/object/upload',
						    download: '/r/repository/object/download',
						    remove: '/r/repository/object/delete'
						  },
                                         file : { list: '/r/repository/file/list',
						  upload: '/r/repository/file/upload',
						  download: '/r/repository/file/download',
						  remove: '/r/repository/file/delete'
						}
				       },
                         project : { list: '/r/project/list',
				     load: '/r/project/load',
				     artifacts: '/r/project/artifacts',
				     remove: '/r/project/delete'
			           },
                         user : { login:  '/r/user/login', 
                                  logout: '/r/user/logout',
                                  whoami: '/r/user/whoami',
                                  autosave: '/r/user/autosave',             
                                  live:   '/r/user/live'
		        	},
                         script : { list: '/r/script/list', execute: '/r/script/execute' }
                      }; 
  
  /*******************************************************************************/
  /*******************************************************************************/
  /*******************************************************************************/

  //////////////////////////
  // Private 
  //////////////////////////
 
   /**
    * A utility method to send off both successful and failure callbacks provided by 
    * the caller. 
    * @private
    * @inner
    * @param {boolean} isSucces Wether the API request was success (Status 200).
    * @param {Object} response The response object as defined by the respect API
    * category.
    */
   var fireCallbackResponse = function (isSuccess, response, callback) {
      if (callback) {
         var scope = (callback.scope || this);
         if (isSuccess && callback.success) {
            callback.success.call(scope, response);
         } else if (!isSuccess && callback.failure){
            callback.failure.call(scope, response);
         }
         callback = null; 
         scope = null;
      }
   };

   var copycat = function(obj, response) {
      try {
         for (var prop in response.deployr.response) {
	    if (obj[prop] !== 'undefined') {
               obj[prop] = response.deployr.response[prop];
	    }
         }
      } catch (e) { }
      return obj;
   };

   var getProp = function(key, def, response) {
      var value = def;
      try {
         for (var prop in response.deployr.response) {
	    if (prop === key) {
               return (response.deployr.response[prop]);
	    }
         }    
      } catch (e) {
	 value = def;
      }

      return value;
   };

   var isVerbose = function(callback) {
       return (callback && callback.verbose || false);	         
   };

  /***********************************************************************************/
  /***********************************************************************************/
  /***********************************************************************************/

  /**
   * <p>
   *   This class provides the interface operations for the <code>Session Service</code>
   *   resource endpoints as described in R Web services.
   * </p>
   * 
   * @namespace R.session
   * @class Session
   * @public
   * @requires R.util.DeployR, R.util.DeployRTransaction
   * @version 1.0
   */
  R.session.Session = function (config) {

  };

  R.session.Session.prototype  = {
      session : '',
      isAlive: false,

      create: function (callback) {
         /** */
         var handleSuccess = function (response) {
            this.session = response.deployr.response.session;
            var verbose = (callback && callback.verbose || false);	         
            response = (verbose ? response : this.session);
            fireCallbackResponse(true, response, callback);
         };

         /** */
         var handleFailure = function (response) {
           fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.create,
				                         method: "POST",
					                 params: { format : 'json' },
					                 silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
	                                                });
         return o;
      },

      close: function (session, callback) {
        var handleSuccess = function (response) {
			this.session = '';
            var verbose = isVerbose(callback);
            response = (verbose ? response : this.session);
            fireCallbackResponse(true, response, callback);
        };

        var handleFailure = function (response) {
          fireCallbackResponse(false, response, callback);
        };

        var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.close,
				                        method: "POST",
					                params: { session: session, format : 'json' },
					                silent: true, // subpress error logging
                             				callback: { success: handleSuccess, 
                                                            failure: handleFailure, 
                                                            scope: this,  
                                                            notify : callback.notify 
                                                        }
	                                              });
        return o;
      },

      ping: function (session, callback) {
        var handleSuccess = function (response) {
	   var isAlive = true;           
           response = (isVerbose(callback) ? response : isAlive);
           fireCallbackResponse(true, response, callback);
        };

        var handleFailure = function (response) {
           fireCallbackResponse(false, response, callback);
        };

        var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.ping,
				                        method: "GET",
					                params: { session: session, format : 'json' },
					                silent: true, // subpress error logging	
                             				callback: { success: handleSuccess, 
                                                                    failure: handleFailure, 
                                                                    scope: this,  
                                                                    notify : callback.notify 
                                                                  }	                           
	                                                 });

        return o;
      },

      code: function (session, code, codeConfig, callback) {
        var handleSuccess = function (response) {
            //this.session = response.deployr.response.session;
            //var verbose = (callback && callback.verbose || false);	         
            //response = (verbose ? response : this.session);
            fireCallbackResponse(true, response, callback);
        };

        var handleFailure = function (response) {
          fireCallbackResponse(false, response, callback);
        };
         
        var cc = (codeConfig || {});
        var robjects = (cc.robjects instanceof Array ? cc.robjects.join(',') : '');
        var files = (cc.files instanceof Array ? cc.files.join(',') : '');

        var  o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.code,
				                         method: "POST",
					                 params: { session: session, 
						                   code: encodeURIComponent(code),
						                   robjects: robjects,
						                   files: files,
                                                                   format : 'json' 
                                                                 },
					                  silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
	                                               });
    
        return o;
      },

      script: function (scriptId, session, scriptConfig, callback) {
        var handleSuccess = function (response) {
            //this.session = response.deployr.response.session;
            //var verbose = (callback && callback.verbose || false);	         
            //response = (verbose ? response : this.session);
            fireCallbackResponse(true, response, callback);
        };

        var handleFailure = function (response) {
          fireCallbackResponse(false, response, callback);
        };
      
        var DeployR = R.util.DeployR;
        var sc = (scriptConfig || {});
        var preload = (sc.preload || '');
        var inputs = DeployR.encode({ 'inputs': DeployR.js2deployr(sc.inputs || {}) });
        var robjects = (sc.robjects instanceof Array ? sc.robjects.join(',') : '');
        var files = (sc.files instanceof Array ? sc.files.join(',') : '');
        var saveworkspace = (sc.saveworkspace || false);

        var  o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.script,
				                         method: "POST",
                               				 params: { session: session, 
                                                                   rscript: scriptId,
				 	                           preload: preload,
						                   inputs: inputs,
 						                   robjects: robjects,
						                   files: files,
                                                                   saveworkspace: saveworkspace,
                                                                   format : 'json' 
                                                                  },
					                  silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
                                                       });
        return o;
      },

      output: function (session, callback) {
         var handleSuccess = function (response) {
           var console = getProp('console', {}, response);          
           response = (isVerbose(callback) ? response : console);
	   fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.output,
						         method: "GET",
		  	 	 	                 params: { session: session, format : 'json' },
						         silent: true, // subpress error logging
                              				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
                                                       });
         return o;
      },

      history: function (session, callback) {
         var handleSuccess = function (response) {
            response = (isVerbose(callback) ? response : getProp('history', [], response));
	    fireCallbackResponse(true, response, callback);
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.history,
						         method: "GET",
		  	 	 	                 params: { session: session, format : 'json' },
						         silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
                                                       });
         return o; 
      },

      saveWorkspace : function (session, descr, callback) {
         var handleSuccess = function (response) {
            var objects = getProp('objects', {}, response);          
            response = (isVerbose(callback) ? response : objects);
	    fireCallbackResponse(true, response, callback);
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

         var  o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.saveWorkspace,
						          method: "POST",
					                  params: { session: session, 
                                                                    format : 'json', 
                                                                    descr: descr 
                                                                  },
						          silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
			                                });
     
         return o;
      },

      saveProject : function (session, descr, callback) {
         var handleSuccess = function (response) {
            var projects = getProp('projects', {}, response);          
            response = (isVerbose(callback) ? response : projects);
	    fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
         };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.saveProject,
				                         method: "POST",
				                         params: { session: session, format : 'json', descr: descr },
				                         silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
		                                       });
         return o;
      }
   }; // end - R.session.Session

  /***********************************************************************************/
  /***********************************************************************************/
  /***********************************************************************************/

  /**
   * <p>
   *   This class provides the interface operations for the <code>Session Object Service</code>
   *   resource endpoints as described in R Web services.
   * </p>
   *
   * @namespace R.session
   * @class SessionObject
   * @public
   * @requires R.util.DeployR, R.util.DeployRTransaction
   * @version 1.0
   */
  R.session.SessionObject = function () {

  }

  R.session.SessionObject.prototype = {
     /**
      * Defines the session id.   
      * @type {string}
      * @default ''
      */
      session : '',

      list: function (session, filter, callback) {
        var handleSuccess = function (response) {
          //this.session = response.deployr.response.session;
          //var verbose = (callback && callback.verbose || false);
          //response = (verbose ? response : this.session);
	      fireCallbackResponse(true, response, callback);
        };

        var handleFailure = function (response) {
		  fireCallbackResponse(false, response, callback);
        };

	    R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.object.list,
				                                method: "GET",
					                            params: { session: session, 
                                                          filter: filter || false, 
                                                          format : 'json' 
                                                        },
				                                silent: true, // subpress error logging
                             					callback: { success: handleSuccess, 
                                                            failure: handleFailure, 
                                                            scope: this,  
                                                            notify : callback.notify 
                                                          }				                               
		                                      });
      },

      get: function(session, name, start, length, callback) {
        var handleSuccess = function (response) {
          //this.session = response.deployr.response.session;
          //var verbose = (callback && callback.verbose || false);
          //response = (verbose ? response : this.session);
          fireCallbackResponse(true, response, callback);
		};

		var handleFailure = function (response) {
		  fireCallbackResponse(false, response, callback);
		};

		R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.object.get,
					                            method: "GET",
					                            params: { session: session,
		 		 	 	                                  name: name || '',
		 	 	 	 	                                  start: start || '',
                                                          length: length || '',
                                                          format : 'json'
						                                },
					                            silent: true, // subpress error logging
                             					callback: { success: handleSuccess, 
                                                            failure: handleFailure, 
                                                            scope: this,  
                                                            notify : callback.notify 
                                                          }					                            
			                                  });
      },

      push: function (session, rObj, callback) {
        /** */
        var handleSuccess = function (response) {
            this.session = response.deployr.response.session;
            var verbose = (callback && callback.verbose || false);	         
            response = (verbose ? response : this.session);
            fireCallbackResponse(true, response, callback);
        };

        /** */
        var handleFailure = function (response) {
          fireCallbackResponse(false, response, callback);
        };

        var inputs = R.util.DeployR.encode({ "inputs" : R.util.DeployR.js2deployr(rObj) });

        R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.object.push,
				                                method: "POST",
					                            params: { session : session,
                           						          format : 'json',
 								                          inputs: inputs
                                                        },
					                            silent: true, // subpress error logging					
                             					callback: { success: handleSuccess, 
                                                            failure: handleFailure, 
                                                            scope: this,  
                                                            notify : callback.notify 
                                                          }					                         
	                                          });
      },

	  upload: function (id, fileName, session, callback) {
        /** */
        var handleSuccess = function (response) {
            //this.session = response.deployr.response.session;
            var verbose = (callback && callback.verbose || false);	         
            //response = (verbose ? response : this.session);
            fireCallbackResponse(true, response, callback);
        };

        /** */
        var handleFailure = function (response) {
          fireCallbackResponse(false, response, callback);
        };

        R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.object.upload,
				                                method: "POST",
                                                isUpload : true,
                                                formId : id,
					                            params: { name : fileName,
                                                          session : session,
                           						          format : 'text'
                                                        },
					                            silent: true, // subpress error logging					
                             					callback: { success: handleSuccess, 
                                                            failure: handleFailure, 
                                                            scope: this,  
                                                            notify : callback.notify 
                                                          }
	                                          });
      },

      remove: function (session, name, callback) {
	    var handleSuccess = function (response) {
          //this.session = response.deployr.response.session;
          //var verbose = (callback && callback.verbose || false);
          //response = (verbose ? response : this.session);
			  fireCallbackResponse(true, response, callback);
		};

		var handleFailure = function (response) {
		  fireCallbackResponse(false, response, callback);
		};

		R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.object.remove,
					                            method: "POST",
					                            params: { session: session,
						                                  name: name,
                                                          format : 'json'
						                                },
					                            silent: true, // subpress error logging
                             					callback: { success: handleSuccess, 
                                                            failure: handleFailure, 
                                                            scope: this,  
                                                            notify : callback.notify 
                                                          }					                           
			                                  });

      },

      save: function (session, name, descr, callback) {
	    var handleSuccess = function (response) {
          //this.session = response.deployr.response.session;
          //var verbose = (callback && callback.verbose || false);
          //response = (verbose ? response : this.session);
          fireCallbackResponse(true, response, callback);
		};

		var handleFailure = function (response) {
	      fireCallbackResponse(false, response, callback);
		};

		R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.object.save,
					                            method: "POST",
					                            params: { session: session,
						                                  name: name || '',
						                                  descr: descr || '',
                                                          format : 'json'
						                                },
					                            silent: true, // subpress error logging
                             					callback: { success: handleSuccess, 
                                                            failure: handleFailure, 
                                                            scope: this,  
                                                            notify : callback.notify 
                                                          }					                            
			                                  });
      },

      load: function (session, id, callback) {
        var handleSuccess = function (response) {
          //this.session = response.deployr.response.session;
          //var verbose = (callback && callback.verbose || false);
          //response = (verbose ? response : this.session);
	      fireCallbackResponse(true, response, callback);
		};

		var handleFailure = function (response) {
		  fireCallbackResponse(false, response, callback);
		};

		R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.object.load,
					                            method: "POST",
					                            params: { session: session,
						                                  id: id,
                                                          format : 'json'
						                                },
					                            silent: true, // subpress error logging
                             					callback: { success: handleSuccess, 
                                                            failure: handleFailure, 
                                                            scope: this,  
                                                            notify : callback.notify 
                                                          }
			                                  });
      }
  }; // end - R.session.Object

  /***********************************************************************************/
  /***********************************************************************************/
  /***********************************************************************************/

  /**
   * <p>
   *   This class provides the interface operations for the <code>Session File Service</code>
   *   resource endpoints as described in R Web services.
   * </p>
   * 
   * @namespace R.session
   * @class File
   * @public
   * @requires R.util.DeployR, R.util.DeployRTransaction
   * @version 1.0
   */
  R.session.File = function () {

  };

  R.session.File.prototype = {
      session : '',
      files : [],

      _loadFiles: function (obj) {
         var files = [];
         for (var file in obj.deployr.response.files) {
	    if (!file) { continue; }
	    var objFile = obj.deployr.response.files[file];
            files.push({name: file, file: objFile.value});	
	 }
         return files;
      },

      /**
       *
       */
      list: function (session, callback) {
         /** */           
         var handleSuccess = function (response) {
            this.session = (response.deployr.response.session || '');
            this.files = this._loadFiles(response);
	    var verbose = (callback && callback.verbose || false);	         
            response = (verbose ? response : this.files);
            fireCallbackResponse(true, response, callback);
          };

          var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
          };

          var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.file.list,
					                  method: "GET",
					                  params: { session: session, format: 'json' },
		                                          silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
	                                                });
         return o;
      }, 

      upload: function (id, fileName, session, callback) {
         /** */
         var handleSuccess = function (response) {
            this.session = response.deployr.response.session;
            var file = this._loadFiles(response); // new file
            var verbose = (callback && callback.verbose || false);	         
            response = (verbose ? response : file);            
            fireCallbackResponse(true, response, callback);
         };

         /** */
         var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.file.upload,
				                         method: "POST",
                                                         isUpload : true,
                                                         formId : id,
					                 params: { name : fileName,
                                                                   session : session,
                           					   format : 'text'
                                                                 },
					                 silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
	                                               });
         return o;  
      },

      download: function (session, name, callback) {
         /** */           
         var handleSuccess = function (response) {
            fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.file.download,
					                 method: "GET",
					                 params: { name: name, session: session, format: 'text' },
		                                         silent: true, // subpress error logging
                               				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
	                                               });
         return o;
      },

      remove: function (session, name, callback) {
         var handleSuccess = function (response) {
	    //this.session = (response.deployr.response.session || '');
	    //var file = this._loadFiles(response);
	    //var verbose = (callback && callback.verbose || false);
	    //response = (verbose ? response : file);
	    fireCallbackResponse(true, response, callback);
	  };

	  var handleFailure = function (response) {
	     fireCallbackResponse(false, response, callback);
	  };

          var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.file.remove,
					                  method: "POST",
					                  params: { name: name, session: session, format: 'json' },
		                                          silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
	                                                });
         return o;
      },

      save: function (session, name, descr, callback) {
         var handleSuccess = function (response) {
	    //this.session = (response.deployr.response.session || '');
	    //var file = this._loadFiles(response);
	    //var verbose = (callback && callback.verbose || false);
	    //response = (verbose ? response : file);
	    fireCallbackResponse(true, response, callback); http://www.revolutionanalytics.com/deployr/demo/dev/
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

         var  o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.file.save,
					                  method: "POST",
		                            		  params: { session: session,
                                                                    name: name,
	 					                    descr: descr,
                                                                    format: 'json' 
                                                                   },
		                                          silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
	                                                 });
         return o;
      },

      load: function (session, id, callback) {
         var handleSuccess = function (response) {
            //this.session = (response.deployr.response.session || '');
            //var file = this._loadFiles(response);
            //var verbose = (callback && callback.verbose || false);
            //response = (verbose ? response : file);
	    fireCallbackResponse(true, response, callback);
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.session.file.load,
					                 method: "POST",
					                 params: { session: session,
						                   id: id,
                                                                   format: 'json'
						                 },
					                 silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
			                               });
         return o;
      }
  }; // end - File

  /**********************************************************************************/
  /**********************************************************************************/
  /**********************************************************************************/

  /**
   * <p>
   *  This class provides the interface operations for the <code>Repository Object Service</code>
   *  resource endpoints as described in R Web services.
   * </p>
   * 
   * @namespace R.repository
   * @class ObjectRepository
   * @public
   * @requires R.util.DeployR, R.util.DeployRTransaction
   * @version 1.0
   */
  R.repository.ObjectRepository = function () {

  };

  R.repository.ObjectRepository.prototype = {

      list: function (callback) {
         var handleSuccess = function (response) {
            //this.session = (response.deployr.response.session || '');
            //var file = this._loadFiles(response);
            //var verbose = (callback && callback.verbose || false);
            //response = (verbose ? response : file);
            fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.repository.object.list,
					                 method: "GET",
				                         params: { format: 'json' },
					                 silent: true, // subpress error logging
                             			         callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
			                               });
         return o;
      },

      upload: function (id, name, callback) {
         var handleSuccess = function (response) {
            //this.session = response.deployr.response.session;
	    //var file = this._loadFiles(response); // new file
	    //var verbose = (callback && callback.verbose || false);
	    //response = (verbose ? response : file);
	    fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
         };

         var o =  R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.repository.object.upload,
					                  method: "POST",
					                  isUpload: true,
				                          formId: id,
				                          params: { name: name, format: 'text' },
					                  silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
                                                        });
         return o;
      },

      download: function (name, id, callback) {
         var handleSuccess = function (response) {
            //this.session = (response.deployr.response.session || '');
            //    var file = this._loadFiles(response);
	    //    var verbose = (callback && callback.verbose || false);	         
            //    response = (verbose ? response : file);
            fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.repository.object.download,
					                 method: "GET",
				                         params: { name: name, id: id, format: 'text' },
		                                         silent: true, // subpress error logging 
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure,
                                                                     scope: this,
                                                                     notify : callback.notify
                                                                   }
                                                       });
         return o;
      },
    
      remove: function (id, callback) {
         var handleSuccess = function (response) {
            //this.session = response.deployr.response.session;
            //var verbose = (callback && callback.verbose || false);
            //response = (verbose ? response : this.session);
	    fireCallbackResponse(true, response, callback);
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.repository.object.remove,
					                 method: "POST",
					                 params: { id: id, format: 'json' },
					                 silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
			                               });
	 return o;
    }
  }; // end - R.repository.ObjectRepository

  /***********************************************************************************/
  /***********************************************************************************/
  /***********************************************************************************/

  /**
   * <p>
   *   This class provides the interface operations for the <code>Repository File Service</code>
   *   resource endpoints as described in R Web services.
   * </p>
   * 
   * @namespace R.repository
   * @class File
   * @public
   * @requires R.util.DeployR, R.util.DeployRTransaction
   * @version 1.0
   */
  R.repository.File = function () {

  };

  R.repository.File.prototype = {

      list: function (callback) {
         var handleSuccess = function (response) {
           //this.session = (response.deployr.response.session || '');
           //var file = this._loadFiles(response);
           //var verbose = (callback && callback.verbose || false);
           //response = (verbose ? response : file);
           fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.repository.file.list,
					                 method: "GET",
				                         params: { format: 'json' },
					                 silent: true, // subpress error logging
                             		        	 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
			                               });
         return o;
      },

      upload: function (id, name, session, callback) {
         var handleSuccess = function (response) {
	    //this.session = response.deployr.response.session;
	    //var file = this._loadFiles(response); // new file
	    //var verbose = (callback && callback.verbose || false);
	    //response = (verbose ? response : file);
	    fireCallbackResponse(true, response, callback);
	 };
	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.repository.file.upload,
					                 method: "POST",
					                 isUpload: true,
					                 formId: id,
					                 params: { name: name, session: session, format: 'text' },
					                 silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
			                               });
         return o;  
      },

      download: function (name, id, callback) {
         var handleSuccess = function (response) {
            //this.session = (response.deployr.response.session || '');
            //    var file = this._loadFiles(response);
	    //    var verbose = (callback && callback.verbose || false);	         
            //    response = (verbose ? response : file);
            fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
           fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.repository.file.download,
					                 method: "GET",
				                         params: { name: name, id: id, format: 'text' },
		                                         silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
	                                                });
         return o;     
      },
    
      remove: function (id, callback) {
         var handleSuccess = function (response) {
            //this.session = response.deployr.response.session;
            //var verbose = (callback && callback.verbose || false);
            //response = (verbose ? response : this.session);
	    fireCallbackResponse(true, response, callback);
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

	 var  o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.repository.file.remove,
					                  method: "POST",
					                  params: { id: id, format: 'json' },
				                          silent: true, // subpress error logging
                             	        		  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
			                                });
         return o;
      }
  }; // end - R.repository.File

  /***********************************************************************************/
  /***********************************************************************************/
  /***********************************************************************************/

  /**
   * <p>
   *   This class provides the interface operations for the <code>Project Service</code>
   *   resource endpoints as described in R Web services.
   * </p>
   * 
   * @namespace R
   * @class Project
   * @public
   * @requires R.util.DeployR, R.util.DeployRTransaction
   * @version 1.0
   */
  R.Project = function () {

  };

  R.Project.prototype = {

      list: function (callback) {
         var handleSuccess = function (response) {
            //this.session = (response.deployr.response.session || '');
            //var file = this._loadFiles(response);
            //var verbose = (callback && callback.verbose || false);
            //response = (verbose ? response : file);
	    fireCallbackResponse(true, response, callback);
	 };

         var handleFailure = function (response) {
	   fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.project.list,
					                 method: "GET",
					                 params: { format: 'json' },
					                 silent: true, // subpress error logging
                             			         callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                      notify : callback.notify 
                                                                   }
			                               });
         return o;
      },

      load: function (id, callback) {
         var handleSuccess = function (response) {
            //this.session = response.deployr.response.session;
            //var verbose = (callback && callback.verbose || false);
            //response = (verbose ? response : this.session);
	    fireCallbackResponse(true, response, callback);
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.project.load,
					                 method: "POST",
				                         params: { id: id, format : 'json' },
					                 silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
			                               });
         return o;
      },

      artifacts: function (id, callback) {
         var handleSuccess = function (response) {
            //this.session = response.deployr.response.session;
            //var verbose = (callback && callback.verbose || false);
            //response = (verbose ? response : this.session);
	    fireCallbackResponse(true, response, callback);
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.project.artifacts,
					                 method: "POST",
				                         params: { id: id, format : 'json' },
					                 silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
			                               });
         return o;
      },

      remove: function (id, callback) {
         var handleSuccess = function (response) {
           //this.session = response.deployr.response.session;
           //var verbose = (callback && callback.verbose || false);
           //response = (verbose ? response : this.session);
	   fireCallbackResponse(true, response, callback);
	 };

	 var handleFailure = function (response) {
	    fireCallbackResponse(false, response, callback);
	 };

	 var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.project.remove,
					                 method: "POST",
					                 params: { id: id, format: 'json' },
					                 silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
			                                });
         return o;
      }
  };

  /***********************************************************************************/
  /***********************************************************************************/
  /***********************************************************************************/

  /**
   * <p>
   *   This class provides the interface operations for the <code>User Service</code>
   *   resource endpoints as described in R Web services.
   * </p>
   * 
   * @namespace R
   * @class User
   * @public
   * @requires R.util.DeployR, R.util.DeployRTransaction
   * @version 1.0
   */
  R.User = function (username, password, autoSave) {       
	this.username = (username || '');
    this.password = (password ? SHA1(password) : '');
    this.autoSave = (autoSave || false);

  }; // end user

  R.User.prototype = {
      username : '',
      password : '',
      cookie : '',
      live : [],
      displayname : '',
      autoSave : false,
      loggedIn : false,
      //error : '',

      /**
       *
       */
      login: function (username, password, autoSave, callback) {
         this.username = username;
         this.password = SHA1(password);
         this.autoSave = autoSave;

         var handleSuccess = function (response) {
	    for (var prop in response.deployr.response) {
	       this[prop] = response.deployr.response[prop];
	    }
            fireCallbackResponse(true, response, callback);
          };

          var handleFailure = function (response) {
             fireCallbackResponse(false, response, callback);
          };          

	  var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.user.login,
					                  method: "POST",
					                  params: { autosave : (this.autoSave || false),
						                    username : this.username,
						                    password : this.password,
                                                                    format : 'json'
					                          },
					                  silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                       notify : callback.notify 
                                                                    }
	                                                });
         return o;    
      }, // end - login

      logout: function (callback) {      
         var handleSuccess = function (response) {
	    this.loggedIn = response.deployr.response.success;
            var verbose = (callback && callback.verbose || false);	         
            response = (verbose ? response : this.loggedIn);
            fireCallbackResponse(true, response, callback);
          };

          var handleFailure = function (response) {
             fireCallbackResponse(false, response, callback);
          };

          var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.user.logout,
					                  method: "POST",
                                 			  params: { format : 'json' },
   					                  silent: true, // subpress error logging
                             		       		  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                       scope: this,  
                                                                        notify : callback.notify 
                                                                    }
	                                                });
         return o;
      }, // end - logout

      whoami: function (callback) {
         var handleSuccess = function (response) {
            //this.live = (response.deployr.response.live || []);
	    //var verbose = (callback && callback.verbose || false);	         
            //response = (verbose ? response : this.live);
            fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.user.whoami,
					                 method: "GET",
 	 	 	 	 	                 params: { format : 'json' },
                                                         silent: true, // subpress error logging
                             				 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
	                                                });
         return o;
      },

      // enable|disable autosave
      autosave: function (autosave, callback) {
         var handleSuccess = function (response) {
            //this.live = (response.deployr.response.live || []);
	    //var verbose = (callback && callback.verbose || false);	         
            //response = (verbose ? response : this.live);
            fireCallbackResponse(true, response, callback);
          };

          var handleFailure = function (response) {
            fireCallbackResponse(false, response, callback);
          };
          
          var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.user.autosave,
					                  method: "POST",
					                  params: { save: autosave || false, format : 'json' },
                                                          silent: true, // subpress error logging
					                  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
	                                                });
         return o;
      },

      live: function (callback) {

         var handleSuccess = function (response) {
            this.live = (response.deployr.response.live || []);
	    var verbose = (callback && callback.verbose || false);	         
            response = (verbose ? response : this.live);
            fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
             fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.user.live,
					                 method: "GET",
	 	 	 	 	                 params: { format : 'json' },
            	                                         silent: true, // subpress error logging
                             		   		 callback: { success: handleSuccess, 
                                                                     failure: handleFailure, 
                                                                     scope: this,  
                                                                     notify : callback.notify 
                                                                   }
	                                               });
         return o;
      } // end -live
  };

  /************************************************************************************/
  /************************************************************************************/
  /************************************************************************************/

  /**
   * <p>
   *   This class provides the interface operations for the <code>R Script Service</code>
   *   resource endpoints as described in R Web services.
   * </p>
   * 
   * @namespace R
   * @class Script
   * @public
   * @requires R.util.DeployR, R.util.DeployRTransaction
   * @version 1.0
   */
  R.Script = function (config) {

  };

  R.Script.prototype = {
      console: {},
      objects: {},
      robjects: {},
      scripts: {},

      list: function (callback) {

         var handleSuccess = function (response) {
	    this.scripts = getProp('scripts', {}, response);		
            response = (isVerbose(callback) ? response : this.scripts);
            fireCallbackResponse(true, response, callback);
         };

         var handleFailure = function (response) {
           fireCallbackResponse(false, response, callback);
         };

         var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.script.list,
					                  method: "GET",
	 	 	 	 	                  params: { format : 'json' },
                        				  silent: true, // subpress error logging
                             				  callback: { success: handleSuccess, 
                                                                      failure: handleFailure, 
                                                                      scope: this,  
                                                                      notify : callback.notify 
                                                                    }
	                                               });
         return o;	
      },

      execute: function (scriptId, scriptConfig, callback) {
         var handleSuccess = function (response) {           
            //var a = getProp('console', {}, response);		
	    //copycat(this, response);		
            fireCallbackResponse(true, response, callback);
         };

        var handleFailure = function (response) {
           fireCallbackResponse(false, response, callback);
        };

        var DeployR = R.util.DeployR;
        var sc = (scriptConfig || {});
        var preload = (sc.preload || '');
        var inputs = DeployR.encode({ 'inputs': DeployR.js2deployr(sc.inputs || {}) });
        var robjects = (sc.robjects instanceof Array ? sc.robjects.join(',') : '');
        var files = (sc.files instanceof Array ? sc.files.join(',') : '');
        var saveworkspace = (sc.saveworkspace || false);

        var o = R.util.DeployRTransaction.sendRequest({ url: API_RESOURCES.script.execute,
				                        method: "POST",
                               				params: { rscript: scriptId,
						                  preload: preload,
				                                  inputs: inputs,
 				     	                          robjects: robjects,
				       	                          files: files,
                                                                  saveworkspace: saveworkspace,
                                                                  format : 'json' 
                                                                },
					                silent: true, // subpress error logging
                             		      		callback: { success: handleSuccess, 
                                                                    failure: handleFailure, 
                                                                    scope: this,   
                                                                    notify: callback.notify 
                                                                   }
                                                       });
         return o;    
      }
  }; // end - R.Script

  /***********************************************************************************/
  /***********************************************************************************/
  /***********************************************************************************/

  ///////////////////////////////////////
  // Public APIs
  ///////////////////////////////////////

  /** @scope R.util.DeployR */
  return { 

    /////////////////////////////////////
    // Session Services
    /////////////////////////////////////

    /**
     * <p>Creates a new R session for the currently logged in user. </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     *
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    createSession: function (callback) {    
       return ((new R.session.Session()).create(callback));
    },
  
    /**
     * <p>
     *  Closes the R session specified by the session identifier, and cleans up all of 
     *  the resources associated with that session. The specific cleanup semantics are
     *  determined by the autosave configuration set on the user.s HTTP session.
     * </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/close",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    closeSession: function (session, callback) {    
       return ((new R.session.Session()).close(session, callback));
    },

    /**
     * <p>Sends a ping to the specified R session to ensure that it is still alive.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/ping",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <code>true</code> if the session is alive <code>false</code> otherwise.
     * </p>
     * @public
     * @param {string} session
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    pingSession: function (session, callback) {    
       return ((new R.session.Session()).ping(session, callback));
    },

    /**
     *
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format:
     * </p>
     * <pre> 
     * {
     *   "deployr": {
     *   "response": {
     *       "success": true,
     *       "call": "/r/session/execute/code",
     *       "session": "LIVE-d14b331c-b9e7-4e88-a46a-8fadbe383094",
     *       "files": {
     *           "test.png": {
     *               "value": "http://[server]/deployr/r/file/download/myplot.png"
     *       },
     *       "robjects": {
     *           "myVector ": {
     *               "type": "vector",
     *               "rclass": "numeric",
     *               "value": [
     *                   -0.39290406400314515,
     *                   1.72026513680149,
     *                   0.41944517687483074,
     * 
     *               ]
     *           }
     *        }
     *     }
     *   }
     * }
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {object} code specifies some R code to execute.
     * @param {object} codeConfig 
     * <ul>
     *  <li>{array} <code>robjects</code> (Optional) list of R objects to be returned.</li>
     *  <li>{array} <code>files</code> (Optional)list of files to be returned.</li>
     * </ul>
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    executeSessionCode: function (session, code, codeConfig, callback) {
       return ((new R.session.Session()).code(session, code, codeConfig, callback));
    },

    /**
     * <p>
     *   Executes the specified R script in a specified R session. The following is 
     *   returned, if generated:
     *   <ul>
     *     <li>Specified R objects</li>
     *     <li> Any errors or warnings</li>
     *     <li>References to any generated plots.</li>
     *     <li>Any console output</li>
     *   </ul>
     * </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     * "deployr": {
     *   "response": {
     *       "success": true,
     *       "call": "/r/session/execute/script",
     *       "robjects": {
     *       },
     *       "objects": {
     *       },
     *       "files": {
     *           "plot001.png": {
     *               "value": "http://[server]/deployr/r/file/download/plot001.png"
     *           }
     *       },
     *       "console": {
     *           "value": "df$b ~ df$a"
     *       },
     *       "session": "LIVE-e0e67988-3403-4c4d-8200-75a0ec18e242"
     *   }
     *  }
     * }
     * </pre>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} scriptId specifies the name of a valid R Script
     * @param {object} scriptConfig the object literal holding the optional 
     *  configuration parameters:
     * <ul>
     *   <li>{string} preload (Optional) Specifies the id of the object to preload in R session.</li>
     *   <li>{object} <code>inputs</code> (Optional). The JSON encoded inputs for the R Script.</li>
     *   <li>{array} <code>robjects</code> (Optional). The list of R objects to be returned.</li>
     *   <li>{array} <code>files</code> (Optional) specifies the list of files
     *   <li>
     *     {boolean} <code>saveworkspace</code> (Optional). When true, the R workspace is saved
     *     after executing R Script. 
     *   </li>
     * </ul>
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    executeSessionScript: function (session, scriptId, scriptConfig, callback) {
       return ((new R.session.Session()).script(scriptId, session, scriptConfig, callback));
    },

    /**
     * <p>Retrieves the last console output from the specified R session. </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/output",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd", 
     *       "console": {
     *           "value": "\nCall:\nlm(formula = x ~ y)\n\nResiduals:\n ...
     *       }
     *    }
     *  }
     * }
     * </pre>
     * <p>
     *   Otherwise, given a <code>verbose</code> flag of <code>false</code> just the
     *   console output is rturned.
     * <pre> "\nCall:\nlm(formula = x ~ y)\n\nResiduals:\n ... </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    getSessionOutput: function (session, callback) {
       return ((new R.session.Session()).output(session, callback));
    },

    /**
     * <p>Retrieves the complete history for the specified R session.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/history",
     *      "history:" ["rprint(summary(lm1))"],
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code> just the
     * history output is rturned.
     * <pre>
     *  ["rprint(summary(lm1))"]
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    getSessionHistory: function (session, callback) {
       return ((new R.session.Session()).history(session, callback));
    },

    /**
     * <p>
     *   Saves the R workspace of the specified R session to the repository on the 
     *   server, and returns an ID to that saved object. 
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/workspace/save",
     *      "objects": {
     *           "My First Workspace": {
     *               "value": "ROBJ-7490529a-b007-4411-a51a-6999b0f71105",
     *               "descr": "My First Workspace",
     *               "url": "http://.../...//OBJ-7490529a-b007-4411-a51a-6999b0f71105"
     *           }
     *      },
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *  }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  ROBJ-7490529a-b007-4411-a51a-6999b0f71105
     * </pre>
     * </p>
     * @public
     * @param {string} session provides a plain text description of the workspace.
     * @param {string} descr specifies a valid session identifier
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    saveSessionWorkspace: function (session, descr, callback) {
       return ((new R.session.Session()).saveWorkspace(session, descr, callback));
    },

    /**
     * <p>
     *   Save the specified R session and associated server state as a RevoDeployR 
     *   project. Saving does not close the current session. 
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/project/save",
     *      "project1": {
     *         "value": "PROJ-895e0152-8be3-4f9b-904a-2f4e9077811f"
     *      },
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  {
     *     "project1": {
     *         "value": "PROJ-895e0152-8be3-4f9b-904a-2f4e9077811f"
     *      }
     *  }     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} descr provides a plain text description of the project.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    saveSessionProject: function (session, descr, callback) {
       return ((new R.session.Session()).saveProject(session, descr, callback));
    },

    /**
     * <p>Defines a two step process of logging in using and a session</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} username specifies the username to log into the system.
     * @param {string} passward specifies the password for username (SHA1 Encoded)
     * @param {boolean} autosave (Optional) true, indicates that all live sessions 
     * created by the user within an HTTP session should be automatically saved.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    loginCreateSession: function (username, password, autosave, callback) {    

       /** @function @inner */
       var loggedIn = function (response) {        
          this.createSession(callback); // callback to original invocation
       };

       /** @function @inner */
       var failLogin = function(response) { fireCallbackResponse(false, response, callback); }            
       var lcb = { success : loggedIn, failure: failLogin, scope: this };
       this.login(username, password, autosave, lcb);
    },

    /////////////////////////////////////
    // Session Object Services
    /////////////////////////////////////

    /**
     * <p>Lists the live R objects and their data types for the specified R session.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/object/list,
     *      "robjects": {
     *           "x": {
     *                 "rclass": "numeric",
     *                 "type": "vector"
     *           },
     *           "y": {
     *                "rclass": "numeric",
     *                "type": "vector"
     *           }
     *      },
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code> just the
     * R Objects are returned:
     * <pre>
     * {
     *   "x": {
     *         "rclass": "numeric",
     *         "type": "vector"
     *        },
     *   "y": {
     *        "rclass": "numeric",
     *        "type": "vector"
     *        }
     * }       
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {boolean} filter (Optional) when true, returns a filtered list of only 
     * those R objects for which values can be retrieved otherwise all R objects will 
     * be returned.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    listLiveSessionObjects: function (session, filter, callback) {    
       return ((new R.session.SessionObject()).list(session, filter, callback));
    },

    /**
     * <p>Retrieves the value of a specified R object for the current R session. </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/object/list,
     *      "robjects": {
     *           "x": {
     *                 "rclass": "numeric",
     *                 "type": "vector",
     *                 "value": [13,14,15]
     *           }
     *      },
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code> just the
     * R Objects are returned:
     * <pre>
     * {
     *   "x": {
     *         "rclass": "numeric",
     *         "type": "vector",
     *         "value": [13,14,15]
     *        }
     * }       
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} name specifies the name of the object to be retrieve.
     * @param {number} start (Optional) The start row.
     * @param {number} length (Optional) The number of rows to retrieve.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    getLiveSessionObject: function (session, name, start, length, callback) {    
       return ((new R.session.SessionObject()).get(session, name, start, length, callback));
    },

    // -- CONTINUE w/DOCS //

    /**
     * <p>Pushes a JSON/XML encoded R object into the specified R session.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {object} inputs specifies the JSON/XML encoded R objects.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    pushSessionObject: function (session, inputs, callback) {    
       return ((new R.session.SessionObject()).push(session, inputs, callback));
    },  

    /**
     * <p>Uploads a binary R object into the specified R session.</p> 
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} formId the id of the form containing the file to upload.
     * @param {string} name specifies the name of the client file to be uploaded.
     * @param {string} session pecifies a valid session identifier.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    uploadSessionObject: function (formId, name, session, callback) {    
       return ((new R.session.SessionObject()).upload(formId, name, session, callback));
    },

    /**
     * <p>Deletes the named R object from the specified R session.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} name specifies the name of the R object to delete.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    deleteSessionObject: function (session, name, callback) {    
       return ((new R.session.SessionObject()).remove(session, name, callback));
    },

    /**
     * <p>
     *  Saves the specified R object in the RevoDeployR repository and returns an 
     *  ID for the new Repository R object. 
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} name specifies the name of the R object to save.
     * @param {string} descr the description of the object being saved.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    saveSessionObject: function (session, name, descr, callback) {    
       return ((new R.session.SessionObject()).save(session, name, descr, callback));
    }, 

    /**
     * <p>
     *  Retrieves the value of a given R object from the RevoDeployR repository, and
     *  then loads it into the specified R session. 
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} id the id of the object to load.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    loadSessionObject: function (session, id, callback) {    
       return ((new R.session.SessionObject()).load(session, id, callback));
    }, 

    /////////////////////////////////////  
    // Session File Services
    /////////////////////////////////////  

    /**
     * <p>Lists files in working directory for specified R session.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    listSessionFiles: function (session, callback) {
       return ((new R.session.File()).list(session, callback));
    },

    /**
     * <p>Uploads file into working directory for specified R session. </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} formId the id of the form containing the file to upload.
     * @param {string} name specifies the name of the file to be uploaded.
     * @param {string} session specifies a valid session identifier.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    uploadSessionFile: function (formId, name, session, callback) {    
       return ((new R.session.File()).upload(formId, name, session, callback));
    },

    /**
     * <p>Downloads file from working directory for specified R session.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} name specifies the file name.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    downloadSessionFile: function (session, name, callback) {    
       return ((new R.session.File()).download(session, name, callback));
    },

    /**
     * <p>Deletes file from working directory for specified R session. </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} name specifies the name of the file to delete.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    deleteSessionFile: function (session, name, callback) {    
       return ((new R.session.File()).remove(session, name, callback));
    },

    /**
     * <p>
     *   Saves file from working directory for specified R session into user's File Repository. 
     * </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} name specifies the name of the file.
     * @param {string} descr specifies a description to be associated with the saved file.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    saveSessionFile: function (session, name, descr, callback) {    
       return ((new R.session.File()).save(session, name, descr, callback));
    },

    /**
     * <p>
     *   Loads file from user's File Repository into working directory for specified R session. 
     * </p> 
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} session specifies a valid session identifier.
     * @param {string} id specifies the repository file identifier.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    loadSessionFile: function (session, id, callback) {    
       return ((new R.session.File()).load(session, id,  callback));
    },

    /////////////////////////////////////      
    // Repository Object Services
    /////////////////////////////////////  

    /**
     * <p>Retrieves the list of the R objects in the user's Object Repository. </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    listRepoObjects: function (callback) {    
       return ((new R.repository.ObjectRepository()).list(callback));
    },

    /**
     * <p>Uploads a binary R object into the user's Object Repository.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} formId the id of the form containing the file to upload.
     * @param {string} name specifies the name of the file to be uploaded.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    uploadRepoObject: function (formId, name, callback) {
       return ((new R.repository.ObjectRepository()).upload(formId, name, callback));
    },

    /**
     * <p>Downloads a binary R object from the user's Object Repository.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} id specifies the identifier of the object.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */    
    downloadRepoObject: function (id, callback) {    
       return ((new R.repository.ObjectRepository()).download(name, id, callback));
    },

    /**
     * <p>Deletes the designated R object from the RevoDeployR repository.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} id specifies the identifier of the object.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    deleteRepoObject: function (id, callback) {    
       return ((new R.repository.ObjectRepository()).remove(id, callback));
    },

    /////////////////////////////////////  
    // Repository File Services
    /////////////////////////////////////  

    /**
     * <p>Lists the files stored in the user's File Repository.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    listRepoFiles: function (callback) {    
       return ((new R.repository.File()).list(callback));
    },

    /**
     * <p>Uploads a file to the user's File Repository.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} formId the id of the form containing the file to upload.
     * @param {string} name specifies the name of the file to be uploaded.
     * @param {string} session specifies a valid session identifier.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    uploadRepoFile: function (formId, name, session, callback) {
       return ((new R.repository.File()).upload(formId, name, session, callback));
    },

    /**
     * <p>Downloads a file from the user's File Repository.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} name specifies the name of the file for download.
     * @param {string} id specifies the identifier of the file for download.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    downloadRepoFile: function (name, id, callback) {
       return ((new R.repository.File()).download(name, id, callback));
    },

    /**
     * <p>Deletes a file from the user's File Repository. </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} id specifies the identifier of the file to be deleted.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    deleteRepoFile: function (id, callback) {
       return ((new R.repository.File()).remove(id, callback));
    },

    /////////////////////////////////////  
    // Project Services
    /////////////////////////////////////  

    /**
     * <p>Lists the RevoDeployR projects belonging to the currently logged in user.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    listProjects: function (callback) {    
       return ((new R.Project()).list(callback));
    },

    /**
     * <p> 
     * Retrieves the specified RevoDeployR project belonging to the currently logged in user 
     * and creates a new R session from the data in the project.
     * </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} id specifies the identifier of the project to retrieve.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    loadProject: function (id, callback) {
       return ((new R.Project()).load(id, callback));
    },

    /**
     * <p>Lists the file artifacts available on the specified project. </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} id specifies the identifier of the project to retrieve.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    listArtifacts: function (id, callback) {    
       return ((new R.Project()).artifacts(id, callback));
    },

    /**
     * <p>Deletes the RevoDeployR project belonging to the currently logged in user.</p> 
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {string} id specifies the identifier of the object.
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    deleteProject: function (id, callback) {    
       return ((new R.Project()).remove(id, callback));
    },

    /////////////////////////////////////  
    // User Services
    /////////////////////////////////////  

    /**
     * <p>
     *   Allows a user to log in using basic authentication, which requires a username and 
     *   password. 
     * </p>
     * <p>Note on <code>password</code>: All passwords are (SHA1 Encoded) within the call.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object}
     * @param {string} username specifies the username to log into the system.
     * @param {string} password specifies the password for username.
     * @param {boolean} autosave (Optional) When true, indicates that all live sessions created
     * by the user within an HTTP session should be automatically saved. 
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    login: function (username, password, autosave, callback) {			   
       return ((new R.User()).login(username, password, autosave, callback));
    },

    /**
     * <p>Logs the user out of the active HTTP session.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    logout: function (callback) {
       return ((new R.User()).logout(callback));
    },

    /**
     * <p>Returns username and display name details of the currently logged in user.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    whoami: function (callback) {
       return ((new R.User()).whoami(callback));
    },

    /**
     * <p>
     *   Enables or disables auto-saving of R sessions active within the user's HTTP session.
     *    When this parameter is set to <code>true</code>, all live R sessions in the user's 
     *    HTTP session will be automatically saved as a project when:
     *    <ul>
     *      <li>The user logs out.</li>
     *      <li>The HTTP session times out.</li>      
     *      <li>The user closes an R session.</li>
     *    </ul>
     * </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {boolean} autosave
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    autosave: function (autosave, callback) {
       return ((new R.User()).autosave(autosave, callback));
    },

    /**
     * <p>Returns a list of all live R sessions in the user's HTTP session</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    live: function (callback) {
       return ((new R.User()).live(callback));
    },
   
    /////////////////////////////////////  
    // RScript Services
    /////////////////////////////////////

    /**
     * <p>Lists all of the R scripts available to the current user.</p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    listScripts: function (callback) {
       return ((new R.Script()).list(callback));
    },

    /**
     * <p>
     *   Executes the specified R script. The following is returned, if generated:
     *   <ul>
     *     <li>Specified R objects.</li>
     *     <li>Any errors or warnings</li>      
     *     <li>References to any generated plots. </li>
     *     <li>Any console output.</li>
     *   </ul>
     * </p>
     * <p>
     *   This produces an asynchronous transaction where the response is recieved and
     *   managed within the provided callback. See the section describing the format 
     *   of the <a href="#callback-format">callback </a> object literial parameter.
     * </p>
     * <p>
     *   A successful response argument returned to the provided callback for this call
     *   takes the following format, given the <code>verbose</code> flag is set to
     *   <code>true</code>:     
     * </p>
     * <pre> 
     * {
     *  "deployr": {
     *    "response": {
     *      "success": true,
     *      "call": "/r/session/create",
     *      "session": "LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd" 
     *    }
     *   }
     * }
     * </pre>
     * <p>
     * Otherwise, given a <code>verbose</code> flag of <code>false</code>:
     * <pre>
     *  LIVE-1daa502b-a68c-48b7-9e54-c3983c2f1cbd     
     * </pre>
     * </p>
     * @public
     * @param {object} scriptId specifies the name of a valid R Script.
     * @param {object} scriptConfig the object literal holding the optional 
     *  configuration parameters:
     * <ul>
     *   <li>{string} preload (Optional) Specifies the id of the object to preload in R session.</li>
     *   <li>{object} <code>inputs</code> (Optional). The JSON encoded inputs for the R Script.</li>
     *   <li>{array} <code>robjects</code> (Optional). The list of R objects to be returned.</li>
     *   <li>{array} <code>files</code> (Optional) specifies the list of files
     *   <li>
     *     {boolean} <code>saveworkspace</code> (Optional). When true, the R workspace is saved
     *     after executing R Script. 
     *   </li>
     * </ul>
     * @param {object} callback the object literal callback configuration.
     * @return {object} Returns the connection object.
     */
    executeScript: function (scriptId, scriptConfig, callback) {
       return ((new R.Script()).execute(scriptId, scriptConfig, callback));
    },

    //////////////////////////////////////////////////////////////////////
    // Help/Utilities
    //////////////////////////////////////////////////////////////////////
  	
	// Argument eventType will have a string value of: startEvent
	// Argument args is an array, and the response object will be the
    // first element in the array.  The response object will have one
     // property: tId (the transaction ID).
    /**
     * <p>
     *   Subscribe to <code>DeployR</code> global custom AJAX events. This can be 
     *   useful in order to manage common event handlers that respond to all possible
     *   <code>DeployR</code> events:
     * </p>
     * <p>
     *   <ul>
     *     <li>start</li>
     *     <li>complete</li>
     *     <li>success</li>
     *     <li>failure</li>
     *     <li>upload</li>
     *     <li>abort</li>
     *   </ul>
     * </p>
     * @param {object}
     * @param {Object}
     */
    globalEventSubsciption : function (eventObj, scope) {         
      if (eventObj && !_isEventReg) {
        scope = scope || eventObj;
        R.util.DeployRTransaction.globalEventSubscription(eventObj, scope);
        _isEventReg = true;
      }
    },

    encode: function (value) {
       return (encodeURIComponent(YAHOO.lang.JSON.stringify(value)));
    },

    decode: function (value) {                
       return (YAHOO.lang.JSON.parse(value));
    },

    /**
     * <p>Convert the deployr object back to the javascript object.</p>
     * @public
     * @param {object} obj the object literal to be converted.
     * @return {object} Returns the 
     */
    deployr2js: function (obj) {
       if (!obj.type) {
          //log("deployr object doesn't have type attribute.");
          return obj;
       }
	
       switch (obj.type) {
          case "primitive" : return obj.value;
	  case "vector" : return obj.value;
	  case "date" : return obj.value;
	  case "factor" : return obj.value;
	  case "matrix" : return obj.value;
	  case "dataframe": {
	         var output = new Object();
	         for (k in obj.value) {
	            output[k] = R.util.DeployR.deployr2js(obj.value[k]);
	         }
	         return output;
	      }
	  case "list" : {
	         var output = new Object();
	         for(k in obj.value) {
	            output[k] = R.util.DeployR.deployr2js(obj.value[k]);
	         }
	         return output;
	      }
	  default : return obj.value;
       } // end -switch        
    }, // end - deploy2js

    /**
     * <p>
     *  Convert a JavaScript object to a valid deployr object.
     *  <ul>
     *    <li>Object -> deployr list</li>
     *    <li>Srray -> deployr vector</li>
     *    <li>Number, Boolean, String -> deployr primitive</li>
     *  </ul>
     * </p>
     * @public
     * @param {object} value
     * @return {object} Returns the
     */
    js2deployr: function (value) {        
       var s = typeof value;
       if (s === 'function' || s === "undefined") { return; }
       
       if (s === 'object') {
          if (!value) {
	     return {"type":"primitive", "value": null};
	  } 
	  if (value instanceof Array) {
             return {"type":"vector", "value": value};
          }
	  var r = { "type": "list", "value": {} };
          var doReturn = false;
	  for (var i in value) {
	     r.value[i] = R.util.DeployR.js2deployr(value[i]);	      
             doReturn = true;
	  }
	  if(!doReturn) { return; }

	  return r;
       }
       return ({ "type":"primitive", "value": value });
    } // end - js2deployr

  } // end - return 

}(); // end - R.util.DeployR

