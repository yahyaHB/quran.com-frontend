import { camelizeKeys } from 'humps';
import { normalize } from 'normalizr';

export default function clientMiddleware() {
  return ({ dispatch, getState }) => next => (action) => {
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }

    const { promise, types, schema, ...rest } = action; // eslint-disable-line no-redeclare
    if (!promise) {
      return next(action);
    }

    const [REQUEST, SUCCESS, FAILURE] = types;

    next({ ...rest, type: REQUEST });
    return promise
      .then(
        (result) => {
          let camelizedJson = camelizeKeys(result);

          if (schema) {
            camelizedJson = normalize(camelizedJson, schema);
          }

          return next({ ...rest, result: camelizedJson, type: SUCCESS });
        },
        (error) => {
          console.error('MIDDLEWARE ERROR:', error); // eslint-disable-line
          return next({ ...rest, error, type: FAILURE });
        }
      )
      .catch((error) => {
        console.error('MIDDLEWARE ERROR:', error); // eslint-disable-line
        next({ ...rest, error, type: FAILURE });
      });
  };
}
