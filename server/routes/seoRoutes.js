const express = require('express');
const { getRobotsTxt, getSitemapXml } = require('../controllers/seo.controller');

const router = express.Router();

router.get('/robots.txt', getRobotsTxt);
router.get('/sitemap.xml', getSitemapXml);

module.exports = router;
