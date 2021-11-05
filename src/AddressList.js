import React from 'react'
import Address from './Address'

export default function AddressList( { addresses }) {
    return (
        <div className="address-list-wrapper">
            <h3>Addresses</h3>
            {addresses.map( address => <Address address={address}/>)}
        </div>
    )
}
