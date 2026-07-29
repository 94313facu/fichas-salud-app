import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import authService from './services/auth.service';

const Registro = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorApi, setErrorApi] = useState(null);
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      setErrorApi(null);
      setCargando(true);
      await authService.registro(
        data.nombre,
        data.especialidad,
        data.username,
        data.password
      );
      navigate('/', { replace: true });
    } catch (err) {
      setErrorApi(err.mensaje || 'Error al registrarse. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="text-center mb-4">
            <i className="bi bi-person-plus text-accent" style={{ fontSize: '3rem' }}></i>
            <h2 className="mt-2 mb-1">Crear Cuenta</h2>
            <p className="text-muted-custom">Regístrate para llevar las fichas de tus pacientes</p>
          </div>

          <div className="card p-4">
            {errorApi && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div>{errorApi}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Campo Nombre Completo */}
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label font-weight-bold">
                  Nombre completo o Razón Social
                </label>
                <input
                  type="text"
                  id="nombre"
                  className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                  placeholder="Ej. Dr. Juan Pérez"
                  {...register('nombre', {
                    required: 'El nombre es obligatorio.',
                    minLength: {
                      value: 3,
                      message: 'El nombre debe tener al menos 3 caracteres.'
                    }
                  })}
                  disabled={cargando}
                />
                {errors.nombre && (
                  <div className="invalid-feedback">{errors.nombre.message}</div>
                )}
              </div>

              {/* Campo Especialidad */}
              <div className="mb-3">
                <label htmlFor="especialidad" className="form-label font-weight-bold">
                  Especialidad <span className="text-muted" style={{ fontSize: '0.85rem' }}>(Opcional)</span>
                </label>
                <input
                  type="text"
                  id="especialidad"
                  className="form-control"
                  placeholder="Ej. Kinesiología, Nutrición"
                  {...register('especialidad')}
                  disabled={cargando}
                />
              </div>

              {/* Campo Email/Usuario */}
              <div className="mb-3">
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
                  placeholder="Mínimo 6 caracteres"
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

              {/* Botón Registrarse */}
              <button
                type="submit"
                className="btn btn-accent w-100 mb-3 text-white"
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creando cuenta...
                  </>
                ) : (
                  'Registrarse'
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-4">
            <p className="text-muted-custom">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-primary font-weight-bold text-decoration-none">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registro;
