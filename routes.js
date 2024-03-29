//#!/usr/bin/env node

//Routes File

'use strict'

/* MODULE IMPORTS */
const Koa = require('koa')
const Router = require('koa-router')
const views = require('koa-views')
const staticDir = require('koa-static')
const bodyParser = require('koa-bodyparser')
const koaBody = require('koa-body')({multipart: true, uploadDir: '.'})
const session = require('koa-session')

/* IMPORT CUSTOM MODULES */
const Display = require('./modules/display.js')
const app = new Koa()
const User = require('./modules/user')
/* CONFIGURING THE MIDDLEWARE */
app.keys = ['darkSecret']
app.use(staticDir('public'))
app.use(bodyParser())
app.use(session(app))
app.use(views(`${__dirname}/views`, { extension: 'handlebars' }, {map: { handlebars: 'handlebars' }}))
const router = new Router()

/**
 * The homepage with gallery items grid.
 *
 * @name homepage Page
 * @route {GET} /homepage
 */

router.get('/homepage', async ctx => {
	try {
		const display = await new Display('website.db')
		const data = await display.list()
		await ctx.render('homepage', {item: data} )
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/**
 * The details page.
 *
 * @name details Page
 * @route {GET} /details
 */

router.get('/details/:id', async ctx => {
	try {
		const display = await new Display('website.db')
		const data = await display.details(ctx.params.id)
		data.userid = await display.userToUserId(data.owner)
		ctx.session.item = ctx.params.id
		await ctx.render('details', data )

	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

router.post('/details', koaBody, async ctx => {
	try {
		const user = await new User('website.db')
		await user.setInterest(ctx.session.username, ctx.session.item, ctx.request.body.interest)

		await ctx.redirect('/homepage')
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})

/**
 * The user page with all their items.
 *
 * @name user-homepage Page
 * @route {GET} /user-homepage/:uid
 */
router.get('/user-homepage', async ctx => {
	try{
		if (ctx.session.authorised !== true) {
			ctx.redirect('/homepage')
		} else {
			const display = await new Display('website.db')
			const data = await display.userDetails(ctx.session.username)
			const userid = await display.userToUserId(ctx.session.username)
			const interests = await display.userInterests(userid)
			const owned = await display.listOwned(ctx.session.username)
			await ctx.render('user', {user: data, interest: interests, owned: owned} )
		}
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
/**
 * Fake Paypal page.
 *
 * @name paypal Page
 * @route {GET} /paypal
 */
router.get('/paypal', async ctx => {
	try {
		const display = await new Display('website.db')
		const data = await display.list()
		await ctx.render('paypal', {item: data} )
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
router.get('/logout', async ctx => {
	ctx.session.authorised = null
	delete ctx.session.username
	ctx.redirect('/?msg=you are now logged out')
})
/**
 * The search page to search globally for items.
 *
 * @name search Page
 * @route {GET} /search
 */
router.get('/search', async ctx => {
	const results = {}
	await ctx.render('search', {item: results})

})
/**
 * The search page to search globally for items.
 *
 * @name search Page
 * @route {POST} /search
 */
router.post('/search', koaBody, async ctx => {
	try {
		const query = ctx.request.body.query
		const display = await new Display('website.db')
		const results = await display.search(query)
		await ctx.render('search', {item: results})
	} catch(err) {
		await ctx.render('error', {message: err.message})
	}
})
module.exports = router
