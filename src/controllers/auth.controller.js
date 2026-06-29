
exports.getLogin = (request, response, next)=>{
    return response.render('pages/login', {
        csrfToken: request.csrfToken(),
        avatarUrl: '/images/bolillo-perfil.jpg',
        title: 'Bolillosos Login ✦'
    });
}

