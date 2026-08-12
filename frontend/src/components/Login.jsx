import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import authService from './services/auth.service';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorApi, setErrorApi] = useState(null);
  const [cargando, setCargando] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  // Login con Google OAuth (auth-code)
  const loginConGoogle = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setErrorApi(null);
        setCargando(true);
        await authService.googleLogin(null, codeResponse.code);
        navigate(from, { replace: true });
      } catch (err) {
        setErrorApi(err.mensaje || 'Error al autenticar con tu cuenta de Google.');
      } finally {
        setCargando(false);
      }
    },
    onError: () => setErrorApi('No se concedieron los permisos de Google.'),
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file'
  });

  const onSubmit = async (data) => {
    try {
      setErrorApi(null);
      setCargando(true);
      await authService.login(data.username, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorApi(err.mensaje || 'Error al iniciar sesión. Verifica tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="text-center mb-4">
            <i className="bi bi-file-earmark-medical text-accent" style={{ fontSize: '3rem' }}></i>
            <h2 className="mt-2 mb-1">Fichas de Salud</h2>
            <p className="text-muted-custom">Ingresa a tu cuenta profesional</p>
          </div>

          <div className="card p-4">
            {errorApi && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>{errorApi}</div>
              </div>
            )}

            {/* Botón de Google Sign In con auth-code */}
            <div className="mb-4 d-flex justify-content-center flex-column align-items-center">
              <button
                type="button"
                className="btn btn-outline-dark w-100 py-2 font-weight-bold d-flex align-items-center justify-content-center shadow-sm"
                onClick={() => loginConGoogle()}
                disabled={cargando}
                style={{ borderRadius: '24px' }}
              >
                <i className="bi bi-google text-danger me-2 fs-5"></i>
                Continuar con Google
              </button>

              <div className="w-100 text-center border-bottom my-3 position-relative">
                <span className="bg-white px-3 text-muted position-relative" style={{ top: '10px', fontSize: '0.85rem' }}>
                  o ingresa con tu email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Campo Email/Usuario */}
              <div className="mb-4">
                <label htmlFor="username" className="form-label font-weight-bold">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="username"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="ejemplo@correo.com"
                  {...register('username', {
                    required: 'El correo electrónico es obligatorio.',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Ingresa un formato de correo válido.'
                    }
                  })}
                  disabled={cargando}
                />
                {errors.username && (
                  <div className="invalid-feedback">{errors.username.message}</div>
                )}
              </div>

              {/* Campo Contraseña */}
              <div className="mb-4">
                <label htmlFor="password" className="form-label font-weight-bold">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Ingresa tu contraseña"
                  {...register('password', {
                    required: 'La contraseña es obligatoria.',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres.'
                    }
                  })}
                  disabled={cargando}
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>

              {/* Botón Ingresar */}
              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-4">
            <p className="text-muted-custom">
              ¿No tienes una cuenta aún?{' '}
              <Link to="/registro" className="text-accent font-weight-bold text-decoration-none">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
