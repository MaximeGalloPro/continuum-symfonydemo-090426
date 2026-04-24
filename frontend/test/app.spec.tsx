import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { App } from '../src/App'

describe('App', () => {
  it('renders the welcome message', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )

    expect(screen.getByText('Migrated Frontend')).toBeInTheDocument()
    expect(screen.getByText('Welcome')).toBeInTheDocument()
  })
})
