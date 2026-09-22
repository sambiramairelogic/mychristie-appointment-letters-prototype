// External dependencies
const express = require('express')
const path = require('path')

const router = express.Router()
const {
  paginateData,
  paginateLettersByType
} = require('./services/letters-pagination')

function renderPaginatedPrototype(viewName, options = {}) {
  const basePath = `/${viewName}`

  return function prototypeHandler(req, res) {
    res.render(viewName, paginateData(req, basePath, options))
  }
}

router.get('/prototype-1', function (req, res) {
  res.render('prototype-1', paginateLettersByType(req, '/prototype-1'))
})
router.get('/prototype-2', renderPaginatedPrototype('prototype-2', { enableSearch: true }))
router.get('/prototype-3', renderPaginatedPrototype('prototype-3', { enableSearch: true }))

router.get('/example-letter', function (req, res) {
  res.render('example-letter', { backLinkHref: req.get('Referer') || '/' })
})

router.get('/example-letter-inline.pdf', function (req, res) {
  const filePath = path.join(__dirname, 'data', 'example-letter.pdf')
  res.sendFile(filePath)
})

router.get('/example-letter.pdf', function (req, res) {
  const filePath = path.join(__dirname, 'data', 'example-letter.pdf')
  res.download(filePath, 'example-letter.pdf')
})

router.post('/create-account-check', function (req, res) {

  const email = req.session.data.email
 
 if (email === "exists") {
   res.redirect('/account-create-pg3b')
 }
 else if (email === "ineligible") {
   res.redirect('/account-create-pg3c')
 }
 else {
   res.redirect('/account-create-pg3a')
 }
})

router.post('/account-check-original', function (req, res) {

  const email = req.session.data.email
 
 if (email === "exists") {
   res.redirect('/account-create-pg3b')
 }
 else if (email === "lost") {
   res.redirect('/cannot-match-record')
 }
 else {
   res.redirect('/account-create-pg4')
 }
})

module.exports = router
