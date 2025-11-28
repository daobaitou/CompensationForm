import axios from '~/axios';

export function login(username, password) {
  return axios.post('/components/Login', 
    { 
        username, 
        password 
    });
}

