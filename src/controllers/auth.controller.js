const { request, response } = require("express");
const supabase = require ('../utils/supabase');

/*getLogin
Function responsible for rendering the login page.
*/

exports.getLogin = (request, response, next)=>{
    return response.render('pages/login', {
        csrfToken: request.csrfToken(),
        avatarUrl: '/images/bolillo-perfil.jpg',
        title: 'Bolillosos Login ✦'
    });
}

//------------------------------------------------------

/* 
doLogin
Function responsible for login into the platform, creating
the actual session of the user and store required data of the
user.
*/

exports.doLogin = async (request, response, next) => {
    const email = request.body.email;
    const password = request.body.password;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error || !data.user) {
            console.log(error);
            
            request.session.error = 'Correo o contraseña inválida.';
            return response.redirect('/');
        }

        
        const user = data.user;
        const isAuth = true;
        request.session.isAuth = true;

        // Pull the matching profile from your profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', user.id);

        if (profileError || !profile) {
            console.log(profileError);
            request.session.error = 'No se pudo acceder a la base de datos. Contactame vida mia';
            return response.redirect('/');
        }

        request.session.user = {
            id: user.id,
            email: user.email,
            username: profile.username || '',
            displayName: profile.display_name || '',
            isAuth
        };
        request.session.success = 'Welcome back.';

        return request.session.save((error) => {
            if (error) {
                console.log(error);
                request.session.error = 'No fue posible guardar la sesión.';
                request.session.success = '';
                return response.redirect('/');
            }
            return response.redirect('/date/accept');
        });

    } catch (error) {
        console.log(error);
        request.session.error = 'No fue posible realizar el acceso.';
        return response.redirect('/');
    }
};


//------------------------------------------------------

/*getLogout
Function responsible for logout the current session.
Only available for authenticated users.*/
exports.getLogout = (request, response, next) => {
    request.session.destroy(async error => {
        if (error) {
            return next(error);
        }
        await supabase.auth.signOut();
        response.redirect("/");
    });
};