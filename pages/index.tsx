import { FormEvent, useState } from 'react';
import styles from '../styles/Home.module.scss';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = {
      email,
      password,
    }
    console.log(data)
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">E-mail</label>
        <input type="email" name="email" id="email" value={email} onChange={e => setEmail(e.target.value)} />
        <label htmlFor="password">Senha</label>
        <input type="password" name="password" id="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>

    </div>
  )
}
