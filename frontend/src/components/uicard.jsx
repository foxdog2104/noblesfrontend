import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';

//Name, image, id
const ModelCard = ({name, image, id}) => {

    const handleClick = (l) => {
        console.log(l + "Linky")
    }

    return(
        <Link>
            <div onClick={handleClick}>
                <img
                className = "cardImage"
                />
            <h2>{name}</h2>
        </div>
        </Link>
    );
}

export default ModelCard