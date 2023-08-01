import React, { useState } from "react"
import {
  BULK_LIMIT,
  BULK_SURCHARGE,
  BULK_TRESHOLD,
  DISTANCE_SURCHARGE,
  EXTRA_BULK_LIMIT,
  EXTRA_BULK_SURCHANGE,
  EXTRA_BULK_TRESHOLD,
  FREE_DELIVERY_TRESHOLD,
  FRIDAY_RUSH_MULTIPLY,
  LONG_DISTANCE_EXTRA_SURCHARGE,
  LONG_DISTANCE_TRESHOLD,
  MAX_DELIVERY_FEE,
  SEVEN_PM_UTC,
  SMALL_ORDER_TRESHOLD,
  THREE_PM_UTC,
} from "../utils/contants"
import InputGroup from "./InputGroup"
import { InputValues } from "../../types/InputValues"
import moment from "moment"

interface Props {
  setDrive: React.Dispatch<React.SetStateAction<boolean>>
}

const DeliveryFeeCalculator = ({ setDrive }: Props): JSX.Element => {
  const [deliveryPrice, setDeliveryPrice] = useState<number | string>()
  const [error, setError] = useState<string>()
  const [inputCartValue, setInputCartValue] = useState<string>("")
  const [inputDistance, setInputDistance] = useState<string>("")
  const [inputItemCount, setInputItemCount] = useState<string>("")
  const [inputDate, setInputDate] = useState<string>("")
  const [inputTime, setInputTime] = useState<string>("")

  const transformInputs = (): InputValues | undefined => {
    const cartValue = Number(inputCartValue)
    const distance = Number(inputDistance)
    const itemCount = Number(inputItemCount)
    const date = new Date(inputDate)
    const [hour, min] = inputTime.split(":")
    const time = moment({ h: Number(hour), m: Number(min) })

    //If negative values, stop the process
    if (cartValue <= 0 || distance <= 0 || itemCount <= 0) {
      setError("Entered invalid values. Values must be positive")
      setTimeout(() => setError(undefined), 5000)
      return undefined
    }

    //Check if order date is friday and time is between [15:00-18:59]
    let isFridayRush = false
    const isRushHours = time.isAfter(moment(THREE_PM_UTC)) && time.isBefore(SEVEN_PM_UTC)
    if (date.getDay() === 5 && isRushHours) {
      isFridayRush = true
    }

    return {
      cartValue: cartValue,
      distance: distance,
      itemCount: itemCount,
      isFridayRush: isFridayRush,
    }
  }

  const calculateLongDistance = (extraDistance: number, extraSurcharge: number): number => {
    const nextLeg = extraDistance - 500
    if (nextLeg > 0) {
      return calculateLongDistance(nextLeg, extraSurcharge + LONG_DISTANCE_EXTRA_SURCHARGE)
    } else {
      return extraSurcharge
    }
  }

  const calculateDelivery = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setDeliveryPrice(undefined)
    const inputValues = transformInputs()
    if (!inputValues) {
      return
    }
    const { cartValue, distance, itemCount, isFridayRush } = inputValues

    let deliveryPrice = 0
    //Cart value checks
    if (cartValue < SMALL_ORDER_TRESHOLD) {
      deliveryPrice += SMALL_ORDER_TRESHOLD - cartValue
    } else if (cartValue >= FREE_DELIVERY_TRESHOLD) {
      setDeliveryPrice(0)
      setDrive(true)
      setTimeout(() => setDrive(false), 4500)
      return
    }

    //Delivery distance checks
    deliveryPrice += DISTANCE_SURCHARGE
    if (distance > LONG_DISTANCE_TRESHOLD) {
      deliveryPrice += calculateLongDistance(
        distance - LONG_DISTANCE_TRESHOLD,
        LONG_DISTANCE_EXTRA_SURCHARGE
      )
    }

    //Item count checks
    if (itemCount >= BULK_TRESHOLD) {
      deliveryPrice += BULK_SURCHARGE * (itemCount - BULK_LIMIT)
    }
    if (itemCount > EXTRA_BULK_TRESHOLD) {
      deliveryPrice += EXTRA_BULK_SURCHANGE * (itemCount - EXTRA_BULK_LIMIT)
    }

    //Time checks
    if (isFridayRush) {
      deliveryPrice *= FRIDAY_RUSH_MULTIPLY
    }

    //Max value check
    deliveryPrice = deliveryPrice <= MAX_DELIVERY_FEE ? deliveryPrice : MAX_DELIVERY_FEE

    //Show first two decimals
    setDeliveryPrice(deliveryPrice.toFixed(2))
    setDrive(true)
    setTimeout(() => setDrive(false), 4500)
  }

  const selectNow = (e: React.SyntheticEvent): void => {
    e.preventDefault()
    const now = new Date()
    const year = now.getFullYear()
    const twoDigits = [now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()]
    //Add '0' before value if value is < 10
    const [month, day, hours, minutes] = twoDigits.map((item) => (item < 10 ? `0${item}` : item))

    setInputDate(`${year}-${month}-${day}`)
    setInputTime(`${hours}:${minutes}`)
  }
  return (
    <div className='calculator'>
      <h2 className='mb-3'>Delivery Fee Calculator</h2>
      {error && <b className='calc-error'>{error}</b>}
      <form onSubmit={calculateDelivery}>
        <InputGroup
          type='number'
          label='Cart Value'
          value={inputCartValue}
          setState={setInputCartValue}
          metric='€'
        />
        <InputGroup
          type='number'
          label='Delivery distance'
          value={inputDistance}
          setState={setInputDistance}
          metric='m'
        />
        <InputGroup
          type='number'
          label='Amount of items'
          value={inputItemCount}
          setState={setInputItemCount}
        />
        <InputGroup type='date' label='Date' value={inputDate} setState={setInputDate} />
        <InputGroup
          type='time'
          label='Time'
          value={inputTime}
          setState={setInputTime}
          selectNow={selectNow}
        />
        <button className='calc-button' type='submit'>
          <b>Calculate delivery price</b>
        </button>
      </form>
      <p data-testid='result'>
        {deliveryPrice === 0
          ? "Free delivery!"
          : deliveryPrice
          ? `Delivery price: ${deliveryPrice} €`
          : ""}
      </p>
    </div>
  )
}

export default DeliveryFeeCalculator
