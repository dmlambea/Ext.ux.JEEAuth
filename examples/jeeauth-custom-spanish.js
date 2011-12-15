/**
 * JEE authentication extension for Ext - customization sample.
 * Copyright 2008, 2011, Daniel M. Lambea <dmlambea@gmail.com>
 *
 * This software is licensed under the terms of the Open Source LGPL 3.0 for
 * non-commercial, non-bundling use. You can read the license terms in the
 * accompanying file COPYING.LESSER. If you wish to bundle this software in a
 * package that will be sold or otherwise directly generate revenue, please
 * contact me at the email address above. 
 */

Ext.apply(Ext.ux.JEEAuth, {
	loginActionConfig: {
		text: 'Entrar',
		tooltip: {
			title: 'Entrar',
			text: 'Iniciar sesión con las credenciales proporcionadas.'
		}
	},

	authMaskConfig: {
		msg: 'Autorizando la entrada...'
	},

	validationErrorTitle: 'Error de validación',
	validationErrorText: 'Los campos resaltados son obligatorios.',
	blankText: 'Este campo es obligatorio.',

	windowTitle: 'Inicio de sesión',
	usernameFieldLabel: 'Usuario',
	passwordFieldLabel: 'Contraseña'
});
