import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import authService from './services/auth.service';

const RecuperarPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorApi, setErrorApi] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (data) => {
    try {
      setErrorApi(null);
      setMensajeExito(null);
      setCargando(true);
      const response = await authService.forgotPassword(data.email);
      setMensajeExito(response.mensaje || 'Se ha enviado un correo con las instrucciones para restablecer tu contraseña.');
    } catch (err) {
      setErrorApi(err.mensaje || 'Error al solicitar el restablecimiento de contraseña. Verifica tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="text-center mb-4">
            <i className="bi bi-shield-lock text-accent" style={{ fontSize: '3rem' }}></i>
            <h2 className="mt-2 mb-1">Recuperar Contraseña</h2>
            <p className="text-muted-custom">Te enviaremos un enlace para restablecerla</p>
          </div>

          <div className="card p-4">
            {errorApi && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>{errorApi}</div>
              </div>
            )}

            {mensajeExito && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                <div>{mensajeExito}</div>
              </div>
            )}

            {!mensajeExito ? (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label font-weight-bold">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="Ingresa tu correo electrónico registrado"
                    {...register('email', {
                      required: 'El correo electrónico es obligatorio.',
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: 'Ingresa un formato de correo válido.'
                      }
                    })}
                    disabled={cargando}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email.message}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={cargando}
                >
                  {cargando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Enviando...
                    </>
                  ) : (
                    'Enviar enlace de recuperación'
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center">
                <p className="text-muted-custom mb-4">
                  Revisa tu bandeja de entrada o la carpeta de spam para encontrar el enlace de recuperación.
                </p>
              </div>
            )}
          </div>

          <div className="text-center mt-4">
            <Link to="/login" className="text-accent font-weight-bold text-decoration-none">
              <i className="bi bi-arrow-left me-1"></i> Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;
