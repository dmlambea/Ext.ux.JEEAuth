/**
 * JEE authentication extension for ExtJS v4.
 * Copyright 2008, 2011, Daniel M. Lambea <dmlambea@gmail.com>
 *
 * This software is licensed under the terms of the Open Source LGPL 3.0 for
 * non-commercial, non-bundling use. You can read the license terms in the
 * accompanying file COPYING.LESSER. If you wish to bundle this software in a
 * package that will be sold or otherwise directly generate revenue, please
 * contact me at the email address above.
 */

/**
 * Namespace definition and default configuration.
 */
Ext.namespace('Ext.ux.JEEAuth');
Ext.apply(Ext.ux.JEEAuth, {
	loginActionConfig: {
		text: 'Login',
		tooltip: {
			title: 'Login',
			text: 'Log in using the provided credentials.'
		}
	},

	authMaskConfig: {
		msg: 'Authenticating...'
	},

	validationErrorTitle: 'Validation error',
	validationErrorText: 'Marked fields are required.',
	blankText: 'This field is required.',

	windowTitle: 'Login',
	formAuthenticationURL: 'j_security_check',
	usernameFieldLabel: 'Username',
	passwordFieldLabel: 'Password',
	usernameFieldName: 'j_username',
	passwordFieldName: 'j_password'
});

/**
 * Builtin login window class.
 */
Ext.define('Ext.ux.JEEAuth.LoginWindow', {
	extend : 'Ext.window.Window',

	/**
	 * Private.
	 */
	jeeauthParams: undefined,
	loginForm: undefined,
	usernameField: undefined,
	passwordField: undefined,

	/**
	 * Overriden show method to reset known fields.
	 */
	show: function (params) {
		Ext.tip.QuickTipManager.init();
		this.jeeauthParams = params;
		this.callParent();
		this.passwordField.reset();
		this.loginForm.isValid();
		var focusFld = (this.usernameField.isValid() ? this.passwordField : this.usernameField);
		focusFld.focus(true, 100);
	},

	/**
	 * Login handler to send the authentication request param to the server.
	 */
	loginHandler: function () {
		if (!this.loginForm.isValid()) {
			Ext.Msg.show({
				title: Ext.ux.JEEAuth.validationErrorTitle,
				msg: Ext.ux.JEEAuth.validationErrorText,
				icon: Ext.Msg.ERROR,
				buttons: Ext.Msg.OK
			});
			return;
		}

		this.loginForm.submit({
			url: Ext.ux.JEEAuth.formAuthenticationURL,
			success: Ext.emptyfn,
			failure: Ext.emptyfn,
			params: {
				_auth_: true
			},
			jeeauthParams: this.jeeauthParams
		});
		this.hide();
	},

	initComponent: function () {
		var loginAction = new Ext.Action(Ext.apply({}, {
			handler: this.loginHandler,
			scope: this
		}, Ext.ux.JEEAuth.loginActionConfig));

		var loginFormPanel = new Ext.form.Panel({
			baseCls: 'x-plain',
			defaultType: 'textfield',

			items: [{
				fieldLabel: Ext.ux.JEEAuth.usernameFieldLabel,
				name: Ext.ux.JEEAuth.usernameFieldName,
				value: '',
				allowBlank: false,
				blankText: Ext.ux.JEEAuth.blankText,
				selectOnFocus: true,
				regex: /\S/i
			}, {
				fieldLabel: Ext.ux.JEEAuth.passwordFieldLabel,
				inputType: 'password',
				name: Ext.ux.JEEAuth.passwordFieldName,
				value: '',
				allowBlank: false,
				blankText: Ext.ux.JEEAuth.blankText,
				selectOnFocus: true
			}]
		});

		/* Cache values for later use */
		this.loginForm = loginFormPanel.getForm();
		this.usernameField = this.loginForm.findField(Ext.ux.JEEAuth.usernameFieldName);
		this.passwordField = this.loginForm.findField(Ext.ux.JEEAuth.passwordFieldName);

		this.usernameField.on('specialkey', function (f, e) {
			if (e.getKey() === e.ENTER) {
				this.passwordField.focus(true);
			}
		}, this);
		this.passwordField.on('specialkey', function (f, e) {
			if (e.getKey() === e.ENTER) {
				loginAction.execute();
			}
		}, this);

		Ext.applyIf(this, {
			layout: 'fit',
			closeAction: 'hide',
			closable: false,
			resizeable: false,
			plain: true,
			title: Ext.ux.JEEAuth.windowTitle,
			bodyStyle: 'padding: 8px;',
			modal: true,
			items: loginFormPanel,
			buttons: [loginAction]
		});
		this.callParent(arguments);
	}
});

/**
 * Override default behavior in Ext.Ajax.
 */
(function () {
	var authInProgress = false;
	var loginWindow;
	var ajaxRequestHandler = Ext.Ajax.request;
	var pendingRequests = [];
	var loadMask;

	/**
	 * Callback for the masked requests.
	 */
	function overridenCallback(options, success, response) {
		var authRequest = false;
		if (loadMask && loadMask.isVisible()) {
			loadMask.hide();
		}

		/* If it was a successful request, check the "authentication required" flag */
		if (success === true) {
			try {
				var result = Ext.decode(response.responseText);
				authRequest = (result.authRequest === 'true');
			} catch (e1) {
				authRequest = false;
			}
		} else {
			authRequest = (response.status === 403);
		}

		if (authRequest) {
			/* If we got an authentication request, raise the login window. Subsequent requests will be queued. */
			if (authInProgress && authInProgress !== options.jeeauthParams.ajaxId) {
				pendingRequests.unshift(options.jeeauthParams.srcOpts);
				return;
			}
			authInProgress = options.jeeauthParams.ajaxId;

			if (!loginWindow) {
				loginWindow = new Ext.ux.JEEAuth.LoginWindow();
			}
			loginWindow.show(options.jeeauthParams);
		} else {
			var justAuthenticated = authInProgress;
			authInProgress = false;

			/* Restore the original options object. */
			options = options.jeeauthParams.srcOpts;
			if (!justAuthenticated) {
				/* Chain the original handlers. */
				if (success === null || response === null) {
					Ext.callback(options.callback, options.scope, [options, null, null]);
				} if (success) {
					Ext.callback(options.success, options.scope, [response, options]);
					Ext.callback(options.callback, options.scope, [options, true, response]);
				} else {
					Ext.callback(options.failure, options.scope, [response, options]);
					Ext.callback(options.callback, options.scope, [options, false, response]);
				}
			} else {
				/* When in concurrency environments, we cannot ensure that the first received
				 * response belongs to the current options' request. Therefore, we need to
				 * trigger the authenticated request again.
				 */
				pendingRequests.unshift(options);
			}

			/* Clear the cached pending requests and relaunch them. */
			var oldPendingRequests = pendingRequests;
			pendingRequests = [];
			for (var i=0; i<oldPendingRequests.length; i++) {
				var opts = oldPendingRequests[i];
				try {
					overridenRequest.call(opts.scope || this, opts);
				} catch(e2) {
					// Log this
				}
				oldPendingRequests[i] = undefined;
			}
		}
	}

	/**
	 * Overriden request method, to be called instead of the one from Ext.Ajax
	 */
	function overridenRequest(o) {
		/* Check that we are not trying to authenticate using the LoginWindow request */
		var authAttempt;
		try {
			authAttempt = o.scope.params._auth_;
		} catch(e) {
			authAttempt = false;
		}

		/* Any external request while authenticating are queued to be sent afterwards */
		if (authInProgress && !authAttempt) {
			pendingRequests.push(o);
			return;
		}

		/* If this request is considered "original", save it back for later.
		 * All requests are marked so that we can distinguish the one we need to
		 * resend in later stages.
		 */
		var jeeauthParams = { };
		if (!authAttempt) {
			Ext.apply(jeeauthParams, {
				ajaxId: Ext.id(),
				srcOpts: Ext.apply({}, o)
			});
		} else {
			jeeauthParams = o.scope.jeeauthParams;
			delete o.scope.jeeauthParams;
			if (!loadMask) {
				loadMask = new Ext.LoadMask(Ext.getBody(), Ext.apply({}, Ext.ux.JEEAuth.authMaskConfig));
			}
			loadMask.show();
		}

		/* Intercept the original callback handler. */
		o.callback = overridenCallback;
		o.jeeauthParams = jeeauthParams;
		delete o.success;
		delete o.failure;
		ajaxRequestHandler.call(Ext.Ajax, o);
	}

	Ext.Ajax.request = overridenRequest;
}());
