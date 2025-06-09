import React, { useState } from 'react';
import { ImLocation2 } from 'react-icons/im';
import { MdAttachEmail } from 'react-icons/md';
import { FaGithubSquare, FaLinkedin, FaGraduationCap, FaFacebookSquare } from 'react-icons/fa';
import { BsPersonFill, BsFillTelephoneOutboundFill } from 'react-icons/bs';
import emailjs from '@emailjs/browser';
import Spinner from '../../components/Spinner/Spinner';

const Contact = () => {
    const [loading, setLoading] = useState(false);

    const sendEmail = e => {
        e.preventDefault();
        setLoading(true);
        emailjs.sendForm(import.meta.env.REACT_APP_emailjs_serviceId, import.meta.env.REACT_APP_emailjs_templateId, e.target, import.meta.env.REACT_APP_emailjs_public_key)
            .then((result) => {
                console.log(result.text);
                setLoading(false);
                e.target.reset();
            }, (error) => {
                setLoading(false);
                console.log(error.text);
            });
    }
    return (
        <div className='px-5 md:px-10 xl:px-0 max-w-7xl mx-auto mb-20 text-white'>
            {
                loading && <div className='custom-align'><Spinner></Spinner></div>
            }
            <h2 data-aos="fade-down" className='uppercase text-lg md:text-2xl xl:text-3xl font-semibold text-center mb-5 lg:mb-10 divider'>Contact Me</h2>
            <div className='flex flex-col lg:flex-row gap-5'>
                <div data-aos="fade-right" className="lg:w-1/3 bg-slate-700 p-5 rounded-lg md:text-xl">
                    <ul className=''>
                        <li>
                            <div className="flex items-center gap-5 mb-3 text-white">
                                <BsPersonFill className='w-6 h-6 text-blue-400' />
                                <p>Md. Mahadi Hasan</p>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center gap-5 mb-3 text-white">
                                <ImLocation2 className='w-6 h-6 text-blue-400' />
                                <p>Chattogram, Bangladesh</p>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center gap-5 mb-3 text-white">
                                <MdAttachEmail className='w-6 h-6 text-blue-400' />
                                <p>mahadihasan@engineer.com</p>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center gap-5 mb-3 text-white">
                                <FaGraduationCap className='w-6 h-6 text-blue-400' />
                                <p>B.Sc in Textile Engineering</p>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center gap-5 mb-3 text-white">
                                <BsFillTelephoneOutboundFill className='w-6 h-6 text-blue-400' />
                                <p>+8801624-772632</p>
                            </div>
                        </li>
                    </ul>
                    <div className='mt-5'>
                        <h3 className='divider text-white'>Social Links</h3>
                        <div className="flex justify-center items-center gap-5 text-blue-300">
                            <a href="https://www.linkedin.com/in/hasan-mahadi/"><FaLinkedin className='w-8 h-8' /></a>
                            <a href="https://github.com/sparkmahadi"><FaGithubSquare className='w-8 h-8' /></a>
                            <a href="https://www.facebook.com/sparkmahadi"><FaFacebookSquare className='w-8 h-8' /></a>
                        </div>
                    </div>
                </div>
                <div data-aos="fade-left" className='lg:w-2/3'>
                    <form onSubmit={sendEmail} action="">
                        <ul className='grid grid-cols-2 gap-5 mb-5'>
                            <li>
                                <input className='input input-bordered w-full' type="text" name="name" placeholder="Your Name" required />
                            </li>
                            <li>
                                <input className='input input-bordered w-full' type="text" name="email" placeholder="Your Email" required />
                            </li>
                            <li>
                                <input className='input input-bordered w-full' type="text" name="subject" placeholder="Subject" required />
                            </li>
                            <li>
                                <input className='input input-bordered w-full' type="number" name="phone" placeholder="Phone Number" required />
                            </li>
                        </ul>
                        <div className='mb-5'>
                            <textarea className='textarea textarea-bordered w-full' name='message' placeholder="Your Message..." required></textarea>
                        </div>
                        <button className='btn btn-sm btn-primary'>Submit</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;