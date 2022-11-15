const express = require('express');
const router = express.Router();

router.get('/collaborator', function (req, res) {
    res.sendFile('index.html', { root: 'public/demos/collaborator/client/build/' });
});

module.exports = router;
