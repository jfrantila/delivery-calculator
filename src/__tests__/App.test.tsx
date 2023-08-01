import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import App from "../components/App"
import userEvent from "@testing-library/user-event"

describe("App component", () => {
  test("Animation render correctly", () => {
    render(<App />)
    const carImage = screen.getByAltText("Delivery-car")
    //When loading app, image responses to 'arrive'-animation (through className='arrive')
    expect(carImage).toHaveAttribute("class", "arrive")

    //When clicking calculate-button, image responses to 'driveaway'-animation (through className='driveaway'). Won't re-render if input values are empty
    const calculateBtn = screen.getByText("Calculate delivery price")
    const [time, date, ...rest] = screen.getAllByTestId("input-group").reverse()
    rest.forEach((input) => userEvent.type(input, "1"))
    userEvent.type(time, "10:00")
    userEvent.type(date, "1900-01-01")

    fireEvent.click(calculateBtn)
    expect(carImage).toHaveAttribute("class", "driveaway")
  })

  test("Submission banner showing", () => {
    render(<App />)
    expect(screen.getByText("Submission for Wolt Internship")).toBeInTheDocument()
  })

  test("Results are not showing", () => {
    render(<App />)
    expect(screen.queryByText(/Delivery price:/i)).not.toBeInTheDocument()
  })
})
