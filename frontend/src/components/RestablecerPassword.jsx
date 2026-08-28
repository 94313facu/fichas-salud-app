import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, Link } from 'react-router-dom';
import authService from './services/auth.service';

const RestablecerPassword = () => {
  const { token } = useParams();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [errorApi, setErrorApi] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [cargando, setCargando] = useState(false);

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    try {
      setErrorApi(null);
      setMensajeExito(null);
      setCargando(true);
      const response = await authService.resetPassword(token, data.newPassword);
      setMensajeExito(response.mensaje || 'Tu contraseña ha sido restablecida con éxito.');
    } catch (err) {
      setErrorApi(err.mensaje || 'Error al restablecer la contraseña. El enlace puede haber expirado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="text-center mb-4">
            <i className="bi bi-key-fill text-accent" style={{ fontSize: '3rem' }}></i>
            <h2 className="mt-2 mb-1">Nueva Contraseña</h2>
            <p className="text-muted-custom">Ingresa tu nueva clave de acceso</p>
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
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label font-weight-bold">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                    {...register('newPassword', {
                      required: 'La nueva contraseña es obligatoria.',
                      minLength: {
                        value: 6,
                        message: 'La contraseña debe tener al menos 6 caracteres.'
                      }
                    })}
                    disabled={cargando}
                  />
                  {errors.newPassword && (
                    <div className="invalid-feedback">{errors.newPassword.message}</div>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label font-weight-bold">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    placeholder="Repite la contraseña"
                    {...register('confirmPassword', {
                      required: 'Debes confirmar la contraseña.',
                      validate: value => value === newPassword || 'Las contraseñas no coinciden.'
                    })}
                    disabled={cargando}
                  />
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">{errors.confirmPassword.message}</div>
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
                      Guardando...
                    </>
                  ) : (
                    'Guardar nueva contraseña'
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center">
                <Link to="/login" className="btn btn-primary w-100">
                  Ir al Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestablecerPassword;
