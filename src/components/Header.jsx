import { Fragment, useContext, useState } from 'react';

import config from '../config.json';
import EICLogo from '../assets/eic.svg';

import { EmailShareButton, FacebookShareButton, LinkedinShareButton, TwitterShareButton, WhatsappShareButton, EmailIcon, FacebookIcon, LinkedinIcon, TwitterIcon, WhatsappIcon } from 'react-share';
import { Dialog, Disclosure, Popover, Transition, PopoverGroup, DisclosurePanel, DisclosureButton, DialogPanel, PopoverButton, PopoverPanel } from '@headlessui/react';
import { AcademicCapIcon, ChevronDownIcon, PlayCircleIcon } from '@heroicons/react/20/solid';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

import { MapViewContext, CurrentJSONContext, ChartSelectionContext, VitalSelectionContext, DataSelectionContext } from '../contexts/AppContext';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

// The Header is the top navigation bar of the application, primary controller for determining context across the application
export default function Header() {
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { mapView } = useContext(MapViewContext);
  const { chartSelection, setChartSelection } = useContext(ChartSelectionContext);
  const { vitalSelection, setVitalSelection } = useContext(VitalSelectionContext);
  const { dataSelection, setDataSelection } = useContext(DataSelectionContext);
  const { currentJSON, setCurrentJSON } = useContext(CurrentJSONContext);

  // Opens and closes the data panel
  const handleDataClick = () => {
    setMobileMenuOpen(false);
    setVitalSelection(false);
    setChartSelection(false);
    if (!dataSelection[0]) {
      console.log('Data button was enabled');
      setDataSelection([true, 0]);
    } else if (dataSelection[0]) {
      console.log('Data button was disabled');
      setDataSelection([false, 0]);
    };
  };

  // Opens and closes the chart panel
  const handleChartClick = () => {
    setMobileMenuOpen(false);
    setVitalSelection(false);
    setDataSelection([false, 0]);
    if (!chartSelection) {
      console.log('Chart button was enabled');
      setChartSelection(true);
    } else if (chartSelection) {
      console.log('Chart button was disabled');
      setChartSelection(false);
    };
  };

  // Opens and closes the vital panel
  const handleVitalClick = () => {
    setMobileMenuOpen(false);
    setChartSelection(false);
    setDataSelection([false, 0]);
    if (!vitalSelection) {
      console.log('Vital button was enabled');
      setVitalSelection(true);
    } else if (vitalSelection) {
      console.log('Vital button was disabled');
      setVitalSelection(false);
    };
  };

  // Guided Tour
  const handleTour = async () => {
    console.log('Guided Tour', currentJSON.name);
    const currentTour = currentJSON.tour;

    setMobileMenuOpen(false);
    setChartSelection(false);
    setVitalSelection(false);
    setDataSelection([false, 0]);

    for (const stop of currentTour) {
      mapView.goTo({ center: [stop.location.longitude, stop.location.latitude], zoom: stop.location.zoom });
      setDataSelection([true, stop.stop]);
      await new Promise(resolve => setTimeout(resolve, stop.location.delay));
    }
    setDataSelection([false, 0]);
    setVitalSelection(true);
  };

  // Learn More
  const handleLearnMore = () => {
    console.log('Learn More');
    window.open('https://gis.earthdata.nasa.gov/portal/home/');
  };

  // Changes the visibility of the layers
  const changeLayer = (item) => {
    console.log('changeLayer', item.name);
    setChartSelection(false);
    setVitalSelection(false);
    setDataSelection([false, 0]);
    setMobileMenuOpen(false);

    mapView.map.layers.forEach(layer => {
      // Set the visibility of all layers to false
      if (layer.title !== item.name && layer.title !== null || layer.title !== 'Country Boundaries') {
        console.log('Hiding layer', layer.title);
        layer.visible = false;
      }

    });
    // Find the layer with the specified name
    const layer = mapView.map.layers.find(layer => layer.title === item.name);

    if (layer) {
      // Toggle the visibility of the layer
      layer.visible = !layer.visible;

      const currentProduct = config.find(product => product.name === layer.title);
      console.log('currentProduct', currentProduct);
      setCurrentJSON(currentProduct);
    }
  };

  // Swap the icons based on the current active layer
  config.forEach(product => {
    if (product.name === currentJSON.name) {
      product.active = false;
    } else {
      product.active = true;
    }
  });

  return (
    <header className='absolute top-0 left-0 w-full z-10 bg-black' style={{ height: '10vh' }}>
      {/* Desktop */}
      <nav className='mx-auto flex max-w-10xl items-center justify-between p-4 lg:px-10'>
        <div className='flex lg:flex-1'>
          <a href='#' className='-m-1.5 p-1.5'>
            <span className='sr-only'>Earth Information Center</span>
            <img className='h-12 w-auto' src={EICLogo} alt='alt' />
          </a>
        </div>
        <div className='flex lg:hidden'>
          <button
            type='button'
            className='-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white'
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className='sr-only'>Open Main Menu</span>
            <Bars3Icon className='h-6 w-6' aria-hidden='true' />
          </button>
        </div>
        <PopoverGroup className='hidden lg:flex lg:gap-x-12'>
          <Popover className='relative'>
            <PopoverButton className='flex items-center gap-x-1 text-sm font-semibold leading-6 text-white'>
              Explore Earth Data
              <ChevronDownIcon className='h-5 w-5 flex-none text-white' aria-hidden='true' />
            </PopoverButton>

            <Transition
              as={Fragment}
              enter='transition ease-out duration-200'
              enterFrom='opacity-0 translate-y-1'
              enterTo='opacity-100 translate-y-0'
              leave='transition ease-in duration-150'
              leaveFrom='opacity-100 translate-y-0'
              leaveTo='opacity-0 translate-y-1'
            >
              <PopoverPanel className='absolute -left-8 top-full z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-black shadow-lg ring-1 ring-gray-900/5'>
                <div className='p-4'>
                  {config.map((item) => (
                    <button
                      key={item.name}
                      className='group relative flex items-center w-full gap-x-6 rounded-lg p-4 text-sm leading-6'
                      onClick={() => changeLayer(item)}
                    >
                      <div className='flex h-11 w-11 flex-none items-center justify-center'>
                        {item.active ? (
                          <calcite-icon style={{ color: 'white' }} icon='circle' />
                        ) : (
                          <calcite-icon style={{ color: 'white' }} icon='circle-f' />
                        )}
                      </div>
                      <div className='flex-auto'>
                        <span className='block font-semibold text-white'>
                          {item.name}
                          <span className='absolute inset-0' />
                        </span>
                        <p className='mt-1 text-white'>{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className='grid grid-cols-2 divide-x divide-gray-900/5 bg-white'>
                  <button onClick={handleTour} className='flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold leading-6 text-black'>
                    <PlayCircleIcon className='h-5 w-5 flex-none text-black' aria-hidden='true' />
                    Guided Tour
                  </button>

                  <button onClick={handleLearnMore} className='flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold leading-6 text-black'>
                    <AcademicCapIcon className='h-5 w-5 flex-none text-black' aria-hidden='true' />
                    Learn More
                  </button>
                </div>
              </PopoverPanel>
            </Transition>
          </Popover>

          <button onClick={handleVitalClick} className='text-sm font-semibold leading-6 text-white'>
            Vitals
          </button>
          <button onClick={handleChartClick} className='text-sm font-semibold leading-6 text-white'>
            Chart
          </button>
          <button onClick={handleDataClick} className='text-sm font-semibold leading-6 text-white'>
            Data
          </button>
        </PopoverGroup>

        <PopoverGroup className='hidden lg:flex lg:flex-1 lg:justify-end'>
          <Popover className='relative'>
            <PopoverButton className='flex items-center gap-x-1 text-sm font-semibold leading-6 text-white'>
              Share <span aria-hidden='true'>&rarr;</span>
            </PopoverButton>

            <Transition
              as={Fragment}
              enter='transition ease-out duration-200'
              enterFrom='opacity-0 translate-y-1'
              enterTo='opacity-100 translate-y-0'
              leave='transition ease-in duration-150'
              leaveFrom='opacity-100 translate-y-0'
              leaveTo='opacity-0 translate-y-1'
            >
              <PopoverPanel className='absolute -right-8 top-full z-10 mt-4 max-w-md overflow-hidden rounded-3xl'>
                <div>
                  <LinkedinShareButton url='#' quote='NASA Earth Information Center Mobile'>
                    <LinkedinIcon round />
                  </LinkedinShareButton>
                  <TwitterShareButton url='#' quote='NASA Earth Information Center Mobile'>
                    <TwitterIcon round />
                  </TwitterShareButton>
                  <FacebookShareButton url='#' quote='NASA Earth Information Center Mobile'>
                    <FacebookIcon round />
                  </FacebookShareButton>
                  <WhatsappShareButton url='#' quote='NASA Earth Information Center Mobile'>
                    <WhatsappIcon round />
                  </WhatsappShareButton>
                  <EmailShareButton url='#' quote='NASA Earth Information Center Mobile'>
                    <EmailIcon round />
                  </EmailShareButton>
                </div>
              </PopoverPanel>
            </Transition>
          </Popover>
        </PopoverGroup>
      </nav>
      {/* Desktop End */}

      {/* Mobile */}
      <Dialog className='lg:hidden' open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className='fixed inset-0 z-10' />
        <DialogPanel className='fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-black px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10'>
          <div className='flex items-center justify-between'>
            <a href='#' className='-m-1.5 p-1.5'>
              <span className='sr-only'>Earth Information Center</span>
              <img className='h-12 w-auto' src={EICLogo} alt='alt' />
            </a>
            <button
              type='button'
              className='-m-2.5 rounded-md p-2.5 text-white'
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className='sr-only'>Close menu</span>
              <XMarkIcon className='h-6 w-6' aria-hidden='true' />
            </button>
          </div>
          <div className='mt-6 flow-root'>
            <div className='-my-6 divide-y divide-gray-500/10'>
              <div className='space-y-2 py-6'>
                <Disclosure as='div' className='-mx-3'>
                  {({ open }) => (
                    <>
                      <DisclosureButton className='flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-white hover:bg-gray-50 hover:text-black'>
                        Explore Earth Data
                        <ChevronDownIcon
                          className={classNames(open ? 'rotate-180' : '', 'h-5 w-5 flex-none')}
                          aria-hidden='true'
                        />
                      </DisclosureButton>
                      <DisclosurePanel className='mt-2 space-y-2'>
                        {config.map((item) => (
                          <button
                            key={item.name}
                            className='group relative flex items-center gap-x-6 rounded-lg p-4 text-sm leading-6 hover:[bg-white text-black]'
                            onClick={() => changeLayer(item)}
                          >
                            <div className='flex h-11 w-11 flex-none items-center justify-center'>
                              {item.active ? (
                                <calcite-icon style={{ color: 'white' }} icon='circle' />
                              ) : (
                                <calcite-icon style={{ color: 'white' }} icon='circle-f' />
                              )}
                            </div>
                            <div className='flex-auto'>
                              <span className='block font-semibold text-white'>
                                {item.name}
                                <span className='absolute inset-0' />
                              </span>
                              <p className='mt-1 text-white'>{item.description}</p>
                            </div>
                          </button>
                        ))}
                        <button onClick={handleTour} className='flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold leading-6 text-white'>
                          <PlayCircleIcon className='h-5 w-5 flex-none text-white' aria-hidden='true' />
                          Guided Tour
                        </button>

                        <button onClick={handleLearnMore} className='flex items-center justify-center gap-x-2.5 p-3 text-sm font-semibold leading-6 text-white'>
                          <AcademicCapIcon className='h-5 w-5 flex-none text-white' aria-hidden='true' />
                          Learn More
                        </button>
                      </DisclosurePanel>
                    </>
                  )}
                </Disclosure>
                <button onClick={handleVitalClick} className='flex w-full rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-50 hover:text-black'>
                  Vitals
                </button>
                <button onClick={handleChartClick} className='flex w-full rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-50 hover:text-black'>
                  Chart
                </button>
                <button onClick={handleDataClick} className='flex w-full rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-gray-50 hover:text-black'>
                  Data
                </button>
              </div>

              <PopoverGroup className='lg:flex lg:flex-1 lg:justify-end'>
                <Popover className='relative'>
                  <PopoverButton className='-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-gray-50 hover:text-black'>
                    Share <span aria-hidden='true'>&rarr;</span>
                  </PopoverButton>

                  <Transition
                    as={Fragment}
                    enter='transition ease-out duration-200'
                    enterFrom='opacity-0 translate-y-1'
                    enterTo='opacity-100 translate-y-0'
                    leave='transition ease-in duration-150'
                    leaveFrom='opacity-100 translate-y-0'
                    leaveTo='opacity-0 translate-y-1'
                  >
                    <PopoverPanel className='absolute top-full z-10 mt-10 max-w-md overflow-hidden rounded-3xl'>
                      <div className='flex space-x-3'>
                        <LinkedinShareButton url='#' quote='NASA Earth Information Center Mobile'>
                          <LinkedinIcon round />
                        </LinkedinShareButton>
                        <TwitterShareButton url='#' quote='NASA Earth Information Center Mobile'>
                          <TwitterIcon round />
                        </TwitterShareButton>
                        <FacebookShareButton url='#' quote='NASA Earth Information Center Mobile'>
                          <FacebookIcon round />
                        </FacebookShareButton>
                        <WhatsappShareButton url='#' quote='NASA Earth Information Center Mobile'>
                          <WhatsappIcon round />
                        </WhatsappShareButton>
                        <EmailShareButton url='#' quote='NASA Earth Information Center Mobile'>
                          <EmailIcon round />
                        </EmailShareButton>
                      </div>
                    </PopoverPanel>
                  </Transition>
                </Popover>
              </PopoverGroup>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
      {/* Mobile End */}
    </header>
  )
}
