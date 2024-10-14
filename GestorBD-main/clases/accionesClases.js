
function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).send('Access denied');
}

function checkAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/auth');
}

module.exports = {
    checkAuthenticated,
    checkAdmin,  // Asumiendo que también tienes esta función
};