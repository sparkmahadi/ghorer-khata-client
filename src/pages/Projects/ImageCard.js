import React from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

const ImageCard = ({ image }) => {
    return (
        <div className="card md:h-80 lg:w-96 mx-auto items-center bg-gray-500 shadow-xl">
            <figure className="px-5 pt-5">
                <PhotoProvider>
                    <PhotoView src={image}>
                        <img src={image} alt="" className="rounded-xl w-full" />
                    </PhotoView>
                </PhotoProvider>
            </figure>
            <div className="card-body items-center p-3">
                <p className='uppercase'>{image?.split('/')[4]?.split('.')[0]?.replace('-', ' ')?.replace('-', ' ')}</p>
            </div>
        </div>
    );
};

export default ImageCard;