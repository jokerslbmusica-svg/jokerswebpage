
export function Hero() {
  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] text-white">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
        <div className="w-4/5 max-w-lg animate-fade-in-down drop-shadow-lg">
          <img
            src="https://i.postimg.cc/Cxpb78PC/Jokers-lb-white.png"
            alt="Jokers Live Band Logo"
            className="w-full h-auto"
          />
        </div>
        <p className="mt-4 text-lg md:text-xl max-w-2xl drop-shadow-md animate-fade-in-up">
          Tu Pase de Acceso Total a Nuestra Música, Contrataciones y Más.
        </p>
      </div>
    </div>
  );
}
