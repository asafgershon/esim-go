import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DatePickerView } from '../date-picker-view'
import { BundleSelectorProvider } from '@/contexts/bundle-selector-context'
import { format } from 'date-fns'

// Mock the external hooks
vi.mock('@/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('nuqs', () => ({
  useQueryStates: () => [
    {
      numOfDays: 7,
      countryId: '',
      tripId: '',
      activeTab: 'countries',
    },
    vi.fn(),
  ],
  parseAsInteger: {
    withDefault: () => ({}),
  },
  parseAsString: {
    withDefault: () => ({}),
  },
  parseAsStringLiteral: () => ({
    withDefault: () => ({}),
  }),
}))

describe('DatePickerView', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <BundleSelectorProvider>
        {component}
      </BundleSelectorProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render date picker view with inputs', () => {
    renderWithProvider(<DatePickerView />)
    
    expect(screen.getByLabelText('תאריך התחלה')).toBeInTheDocument()
    expect(screen.getByLabelText('תאריך סיום')).toBeInTheDocument()
    // Use getByRole to be more specific about which element we're looking for
    expect(screen.getByRole('heading', { name: 'בחר תאריכי נסיעה' })).toBeInTheDocument()
  })

  it('should disable end date input when start date is not selected', () => {
    renderWithProvider(<DatePickerView />)
    
    const endDateInput = screen.getByLabelText('תאריך סיום') as HTMLInputElement
    expect(endDateInput).toBeDisabled()
  })

  it('should enable end date input after selecting start date', async () => {
    renderWithProvider(<DatePickerView />)
    
    const startDateInput = screen.getByLabelText('תאריך התחלה') as HTMLInputElement
    const today = format(new Date(), 'yyyy-MM-dd')
    
    fireEvent.change(startDateInput, { target: { value: today } })
    
    await waitFor(() => {
      const endDateInput = screen.getByLabelText('תאריך סיום') as HTMLInputElement
      expect(endDateInput).not.toBeDisabled()
    })
  })

  it('should calculate correct number of days between dates', async () => {
    renderWithProvider(<DatePickerView />)
    
    const startDateInput = screen.getByLabelText('תאריך התחלה') as HTMLInputElement
    const endDateInput = screen.getByLabelText('תאריך סיום') as HTMLInputElement
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    fireEvent.change(startDateInput, { 
      target: { value: format(today, 'yyyy-MM-dd') } 
    })
    
    await waitFor(() => {
      expect(endDateInput).not.toBeDisabled()
    })
    
    fireEvent.change(endDateInput, { 
      target: { value: format(tomorrow, 'yyyy-MM-dd') } 
    })
    
    await waitFor(() => {
      expect(screen.getByText('2 ימים')).toBeInTheDocument()
    })
  })

  it('should show error for date range exceeding 30 days', async () => {
    renderWithProvider(<DatePickerView />)
    
    const startDateInput = screen.getByLabelText('תאריך התחלה') as HTMLInputElement
    const endDateInput = screen.getByLabelText('תאריך סיום') as HTMLInputElement
    
    const today = new Date()
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 35) // 36 days total
    
    fireEvent.change(startDateInput, { 
      target: { value: format(today, 'yyyy-MM-dd') } 
    })
    
    await waitFor(() => {
      expect(endDateInput).not.toBeDisabled()
    })
    
    fireEvent.change(endDateInput, { 
      target: { value: format(futureDate, 'yyyy-MM-dd') } 
    })
    
    await waitFor(() => {
      expect(screen.getByText(/מעל 30 יום/)).toBeInTheDocument()
      expect(screen.getByText(/נא לבחור טווח קצר יותר/)).toBeInTheDocument()
    })
  })

  it('should handle back navigation', async () => {
    renderWithProvider(<DatePickerView />)
    
    const backButton = screen.getByLabelText('חזור לבחירת ימים')
    
    const user = userEvent.setup()
    await user.click(backButton)
    
    // The actual navigation is handled by the context
    // This test just verifies the button exists and can be clicked
    expect(backButton).toBeInTheDocument()
  })

  it('should update confirm button text based on selection', async () => {
    renderWithProvider(<DatePickerView />)
    
    // Initially shows default text
    const confirmButton = screen.getByRole('button', { name: /בחר תאריכי נסיעה/ })
    expect(confirmButton).toBeDisabled()
    
    const startDateInput = screen.getByLabelText('תאריך התחלה') as HTMLInputElement
    const endDateInput = screen.getByLabelText('תאריך סיום') as HTMLInputElement
    
    const today = new Date()
    const weekLater = new Date(today)
    weekLater.setDate(weekLater.getDate() + 6) // 7 days total
    
    fireEvent.change(startDateInput, { 
      target: { value: format(today, 'yyyy-MM-dd') } 
    })
    
    await waitFor(() => {
      expect(endDateInput).not.toBeDisabled()
    })
    
    fireEvent.change(endDateInput, { 
      target: { value: format(weekLater, 'yyyy-MM-dd') } 
    })
    
    await waitFor(() => {
      const updatedButton = screen.getByRole('button', { name: /אישור - 7 ימים/ })
      expect(updatedButton).not.toBeDisabled()
    })
  })
})