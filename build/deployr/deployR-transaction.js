
namespace("R"); 
namespace("R.util"); 
namespace("R.repository");    
namespace("R.session"); 

/**
 * @fileOverview This file defines methods for managing asynchronous transactions 
 * and callback logic within the RevoDeployR JavaScript client libraries. 
 * @author Revolution Analytics
 * @version 1.0 release
 */

(function(){
   var JSON = YAHOO.lang.JSON,
       YUC  = YAHOO.util.Connect;

/**
 * Mechanism to encapsulate the transaction request and callback logic for the
 * diffrent RevoDeployR Web Srvices API invocations. This class acts as a simple 
 * wrapper around the YUI <code>Connection Manager</code> exposing a subset of 
 * methods for creating and managing asynchronous transactions.
 *
 * @namespace R.util
 * @class DeployRTransaction
 * @static
 * @requires YAHOO.util.Connect
 * @version 1.0
 */
R.util.DeployRTransaction = {

   /**
    * Defines the base URL to the DeployR API resources.
    * @public
    * @memberOf R.util.DeployRTransaction
    * @type String
    */
   DEPLOY_R_URL_PATH : '/deployr',

   SUCCESS : true,
   FAIL : false,

  /**
   * <p>
   *   Provides the base success case logic deligating out callback behavior to
   *   be processed further. The given response object literial <code> o </code> 
   *   takes the following keys:
   * </p>
   * <p> <a name="response"></a>   
   *   <ul>
   *     <li><code>tId</code> - The unique, incremented id for the transaction.</li>
   *     <li><code>status</code> - The HTTP status code of the resulting transaction.</li>
   *     <li><code>statusText</code> - The message associated with the HTTP status. </li>
   *     <li><code>getResponseHeader</code> - Returns the string value of the specified header label.</li>
   *     <li><code>getAllResponseHeaders</code> - All returned HTTP headers available as a string.</li>
   *     <li><code>responseText</code> - The server's response as a string.</li>
   *     <li><code>responseXML</code> - The server's response as a XML document.</li>
   *     <li><code>argument</code> - The user-defined arguments from the callback.</li>
   *   </ul>
   * </p>
   * <p> 
   *   The response object forwarded to the caller upon success will be parsed,
   *   evaluated, and remain formated identical to the deployR JSON the server 
   *   retuned.
   * </p>
   * @public
   * @methodOf R.util.DeployRTransaction
   * @param {Object} o the object literial response object.
   */
   handleSuccess: function(o) {
      this.logRequestOutput(o);

      if (o.status == 200) {
         this.processResult(this.SUCCESS, o);
      } else {
         this.handlerFailure(o);
      }
   },

  /**
   * <p>
   * Provides failure case logic by failing to return at all ot forwarding the 
   * <code>status</code> code and the <code>statusText</code> description to the 
   * failure callback within the defined execution scope should it have been 
   * provided. The given response object literial takes the following keys:
   * </p>
   * <p>
   *   <ul>
   *     <li><code>tId</code> - The unique, incremented id for the transaction.</li>
   *     <li><code>status</code> - The HTTP status code of the resulting transaction.</li>
   *     <li><code>statusText</code> - The message associated with the HTTP status. </li>
   *     <li><code>argument</code> - The user-defined arguments from the callback.</li>
   *   </ul>
   * </p>
   * @public
   * @methodOf R.util.DeployRTransaction
   * @param {Object} o the object literial response object.
   */
   handleFailure: function(o) {
      this.logRequestOutput(o);	
      this.processResult(this.FAIL, o);
   },

  /**
   * <p>
   * Provides success case logic by forwarding the response object to the success 
   * callback within the defined execution scope should it have been provided. The 
   * given response object literial takes the following <a href="#response">keys</a>.
   * </p>
   * @public
   * @methodOf R.util.DeployRTransaction
   * @param {Object} o the object literial response object.
   */
   processResult: function(success, o) {
      var callback = o.argument;
      var scope = callback.scope || this;

      try { 
         if(success && callback && callback.success) {           
            var format = callback.format;
            var response = (format == "json" ? JSON.parse(o.responseText) : o.responseText);
	    if (this._isSuccess(response, format)) {
	       callback.success.call(scope, response);
	    } else if (callback.failure && format == 'json') {
               // Handle a valid status = 200 HTTP response, with a success=false           
               o.status = 'STATUS-CODE-UNKNOWN';
               o.statusText = response.deployr.response.error;
               callback.failure.call(scope, o);
	    } else if (!success && callback && callback.failure) {
               callback.failure.call(scope, o);
            }
         } 
      } catch (e) {
         // should never happen
      } finally { // notification that the transaction has completed
	 if (callback && callback.notify) {      
            callback.notify.call(scope, o);
         }
     }
   },
  
  /**
   * <p>
   * Manages the response logic for the completion of an asynchronous file upload.
   * Since file uploading occurs through an iframe, traditional response data such as 
   * HTTP status codes are not directly available, and connection manager cannot 
   * reasonably discern success or failure. Instead, the callback's upload handler 
   * will receive a response object containing the body of the iframe document, as a 
   * string, when the transaction is complete. The given response object literial 
   * takes the following keys:
   * </p>
   * <p>
   * <ul>
   *   <li><code>tId</code> - The unique, incremented id for the transaction.</li>
   *   <li><code>status</code> - The HTTP status code of the resulting transaction.</li>
   *   <li><code>statusText</code> - The message associated with the HTTP status. </li>
   *   <li><code>argument</code> - The user-defined arguments from the callback.</li>
   * </ul>
   * </p>
   * @public
   * @methodOf R.util.DeployRTransaction
   * @param {Object} o the object literial response object.
   */
   uploadHandler: function (o) {
      var callback = o.argument;

       if (o.responseText) {
          if (callback.success) {
	     var scope = callback.scope || this;
             callback.success.call(scope, JSON.parse(o.responseText));              
             //callback.success.call(scope, o.responseText);
          }
        } else {
           this.handleFailure(o);
        }
   },

   /**
    * <p>
    * Method for initiating an asynchronous request via the XHR object. The request
    * object literial configuration takes the following keys:
    * </p>
    * <p>
    * <ul>
    *   <li><code>method</code> - HTTP transaction method</li>
    *   <li><code>url</code> - Fully qualified path of resource</li>
    *   <li>
    *     <code>params</code> - The request's GET|POST respective POST body|querystring
    *   </li>
    *   <li>
    *    <code>callback</code> - {Object} (Optional) User-defined callback object 
    *    literal containing the following keys:
    *    <ul>
    *      <li><code>success</code> - {Function} success callback
    *      <li><code>failure</code> - {Function} failure callback
    *      <li><code>scope</code> - {Object} callback's execution scope
    *    </ul>
    *   </li>
    * </ul>
    * </p>
    * @public
    * @methodOf R.util.DeployRTransaction
    * @param {Object} config The object literial containing the request configuration.
    * @return {Object} Returns the connection object.
    */
   sendRequest: function(config) {
      config.callback.format = config.params.format;

      var callback = { success: R.util.DeployRTransaction.handleSuccess,
                       failure: R.util.DeployRTransaction.handleFailure,
                       upload: R.util.DeployRTransaction.uploadHandler,
                       scope: R.util.DeployRTransaction,
                       argument : config.callback, // include caller's callback
                       timeout: 20*60*1000, //timeout is set to 20 minutes
                       cache : false
	             };

      var method = config.method || 'GET';
      var uri = this.DEPLOY_R_URL_PATH + config.url;
      var params = this.jsonToNameValue(config.params, method);

      // GET - put params on URL
      if (method == 'GET') {         
        uri += '?' + params;        
        params = null;
      }

      this.logRequestInput(method, config.url, config.params);
      
      // async - file upload
      if (config.isUpload) {
         method = 'POST';
         YUC.setForm(config.formId, true);
      }

      return (YUC.asyncRequest(method, uri, callback, params));      
   },

   globalEventSubscription : function (events, scope) {
      YUC.startEvent.subscribe(events.start, scope);      
      YUC.completeEvent.subscribe(events.complete, scope);
      // This event will not fire for file upload transactions.
      YUC.successEvent.subscribe(events.success, scope);
      // This event will not fire for file upload transactions.    
      YUC.failureEvent.subscribe(events.failure, scope);
      // This event is fired only for file upload transactions
      YUC.uploadEvent.subscribe(events.upload, scope);
      YUC.abortEvent.subscribe(events.abort, scope);
   },

   logRequestOutput: function (o) { /** override */ },
   logRequestInput: function (method, url, params) { /** override */ },

   /**
    * Helper utility to extract the success value out of the JSON response should
    * the response be encoded in JSON.
    * @private
    * @param {object} response the deployR response object literial.
    * @param {string} format the format of the response object.
    * @return 
    */
   _isSuccess: function(response, format) {
      var status = true; 
      if (format == 'json') {
         status = response.deployr.response.success;
      }
      return status;
   },

   /**
    * Helper utility to flaten JSON inot Name/Value pairs used within the request.
    * @ignore    
    */
   jsonToNameValue : function (obj, method) {
      var results = [];
      var convert = function (obj) {
         for (var key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] != null && obj[key] != undefined) {
               var value = obj[key];
               if (value == null) { continue; }
               if (value instanceof Object) {
                 convert(value);
               }
	       results.push(key + "=" + (method == 'GET' ? encodeURIComponent(value) : value));
            }
         }
      };

      convert(obj);
      return (results.join("&"));
   }

}; // end transaction

})();


// namespace
function namespace(){var a=arguments, o=null, i, j, d;for (i=0; i<a.length; i=i+1){d=a[i].split(".");o=window;for (j=0; j<d.length; j=j+1){o[d[j]]=o[d[j]] || {};o=o[d[j]];}}return o;};
