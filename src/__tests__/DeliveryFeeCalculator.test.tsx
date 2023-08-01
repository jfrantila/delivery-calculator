import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import DeliveryFeeCalculator from "../components/DeliveryFeeCalculator"

let cartValueInput: HTMLElement,
  distanceInput: HTMLElement,
  itemCountInput: HTMLElement,
  dateInput: HTMLElement,
  timeInput: HTMLElement,
  calculateBtn: HTMLElement

beforeEach(() => {
  render(<DeliveryFeeCalculator setDrive={jest.fn()} />)
  const [cartValue, distance, itemCount, date, time] = screen.getAllByTestId("input-group")
  cartValueInput = cartValue
  distanceInput = distance
  itemCountInput = itemCount
  dateInput = date
  timeInput = time
  calculateBtn = screen.getByText("Calculate delivery price")
})

const fillForm = (
  cartValue: string,
  distance: string,
  itemCount: string,
  date: string,
  time: string
) => {
  userEvent.type(cartValueInput, cartValue)
  userEvent.type(distanceInput, distance)
  userEvent.type(itemCountInput, itemCount)
  userEvent.type(dateInput, date)
  userEvent.type(timeInput, time)
}

describe("DeliveryFeeCalculator component", () => {
  test("Two buttons: 'calculate delivery fee' and 'now' rendered", () => {
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBe(2)
    expect(calculateBtn).toBeVisible()
    expect(screen.getByText("Now")).toBeVisible()
  })

  test("Inputfields are required", () => {
    const inputFields = screen.getAllByTestId("input-group")
    inputFields.forEach((input) => expect(input).toBeRequired())
  })

  test("Input values are invalid (negative or 0)", () => {
    fillForm("-10", "0", "-2", "1900-01-01", "10:00")

    fireEvent.click(calculateBtn)

    //Error message showing
    expect(screen.getByText("Entered invalid values. Values must be positive")).toBeVisible()
    //Results are not given
    expect(screen.queryByText(/Delivery price:/i)).not.toBeInTheDocument()
  })

  test("Clicking 'Now'-button sets date and time correctly", () => {
    const nowBtn = screen.getByText("Now")
    const now = new Date()
    const correctDate = `${now.getFullYear()}-${now.getMonth() + 1 < 10 ? "0" : ""}${
      now.getMonth() + 1
    }-${`${now.getDate() < 10 ? "0" : ""}${now.getDate()}`}`
    const correctTIme = `${now.getHours() < 10 ? "0" : ""}${now.getHours()}:${`${
      now.getMinutes() < 10 ? "0" : ""
    }${now.getMinutes()}`}`

    fireEvent.click(nowBtn)

    expect(dateInput).toHaveValue(correctDate)
    expect(timeInput).toHaveValue(correctTIme)
  })

  test("Round to two decimals", () => {
    fillForm("6.3589", "1001", "13", "2023-01-13", "15:04")
    //Calculations: ((10-6.3589)+(2+1)+(0.5*(13-4))+(1.2*(13-12)))*1.2 = 14.80932
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 14.81 €")
  })
})

describe("Cart value calculations are correct", () => {
  test("Cart value >= 100 shows Free delivery", () => {
    //Should set price to 0 and show 'Free delivery!'
    fillForm("100", "200", "1", "2023-01-16", "10:30")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result")).toHaveTextContent("Free delivery!")
  })
  test("Cart value >= 100 with other values adding up shows Free delivery", () => {
    //Should set price to 0 and show 'Free delivery!'
    //Other values should not impact this value
    fillForm("101", "20000", "25", "2023-01-13", "15:30")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result")).toHaveTextContent("Free delivery!")
  })

  test("Cart value >= 10 doesn't add extra surcharge", () => {
    //Calculations: 10-10+2
    fillForm("10", "100", "1", "2023-01-16", "10:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 2.00 €")
  })

  test("Cart value < 10 adds surcharge of the difference between the cart value and 10€", () => {
    //Calculations: 10-7+2
    fillForm("7", "100", "1", "2023-01-16", "10:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 5.00 €")
  })
})

describe("Distance calculations are correct", () => {
  test("Distances <= 1000m add 2e surcharge", () => {
    fillForm("10", "1000", "1", "2023-01-16", "10:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 2.00 €")
  })

  test("Distance ]1000-1500] adds 2e surcharge from first km and 1e for the 1-499m over 1km", () => {
    fillForm("10", "1499", "1", "2023-01-16", "10:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 3.00 €")
  })

  test("Distance ]1500-2000] adds 2e surcharge from first km and 1e for every next 500m started", () => {
    fillForm("10", "1500", "1", "2023-01-16", "10:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 3.00 €")
  })

  test("Distance >1000m adds 2e surcharge from first km and 1e for every next 500m started", () => {
    fillForm("10", "4001", "1", "2023-01-16", "10:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 9.00 €")
  })
})

describe("Item count calculations are correct", () => {
  test("Item count < 5 and no extra surcharge", () => {
    fillForm("10", "100", "4", "2023-01-16", "10:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 2.00 €")
  })

  test("Item count [5-12] (case 5) adds 50snt to each item over 4", () => {
    fillForm("10", "100", "5", "2023-01-16", "10:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 2.50 €")
  })

  test("Item count [5-12] (case 12) adds 50snt to each item over 4", () => {
    fillForm("10", "100", "12", "2023-01-16", "10:00")
    //Calculations: 2e + 0.5*(12-4) + 1.2*(12-12)
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 6.00 €")
  })

  test("Item count >13 adds 50snt to each item over 4", () => {
    fillForm("10", "100", "13", "2023-01-16", "10:00")
    //Calculations: 2e + 0.5*(13-4) + 1.2*(13-12)
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 7.70 €")
  })
})

describe("Friday rush calculations are correct", () => {
  test("Friday rush multiplies the result by 1.2 (case 15:00)", () => {
    fillForm("10", "1000", "4", "2023-01-13", "15:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 2.40 €")
  })

  test("Friday rush multiplies the result by 1.2 (case 19:00)", () => {
    fillForm("10", "1000", "4", "2023-01-13", "19:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 2.40 €")
  })

  test("Friday but not in rush hour due to time", () => {
    fillForm("10", "1000", "4", "2023-01-13", "19:01")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 2.00 €")
  })

  test("Time is [3-7UTC] but day is not friday", () => {
    fillForm("10", "1000", "4", "2023-01-16", "15:00")
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 2.00 €")
  })
})

describe("All input values have impact and are calculated correctly", () => {
  test("Result <= 15e so nothing changes", () => {
    fillForm("5", "1499", "7", "2023-01-13", "15:45")
    //Calculations: ((10-5)+(2+1)+(0.5*(7-4)))*1.2
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 11.40 €")
  })

  test("Result > 15e, but delivery fee max 15e is set", () => {
    fillForm("2", "3499", "25", "2023-01-06", "18:59")
    //Calculations: ((10-2)+(2+1+1+1+1+1)+(0.5*(25-4))+(1.2*(25-12)))*1.2 = 49.32
    fireEvent.click(calculateBtn)
    expect(screen.getByTestId("result").textContent).toContain(" 15.00 €")
  })
})
