package NeuralNetwork;

/**
 * A singular Neuron in a <code>NeuralNetwork</code>
 * @author Evan Partidas
 *
 */
public abstract class Neuron {
	protected
	double inputValue,outputValue,error;
	double[] weights,weightDeltas;
	/**
	 * Constructs a Neuron with a random weight matrix
	 *  @param neurons number of neurons in next layer
	 */
	public Neuron(int neurons){
		inputValue=0;
		outputValue=0;
		error=0;
		//checking if output layer
		if(neurons>0){
			weightDeltas = new double[neurons];
			weights = new double[neurons];
			randomize();
		}
	}
	
	/**
	 * Randomize all the weight matrices
	 */
	public void randomize(){
		for(int i=0;i<weights.length;i++)
			weights[i]=(2*Math.random())-1;
	}
	
	/**
	 * Adjusts the weights using the set error value.
	 * 
	 * @param rate the learning rate
	 */
	public void adjust(double rate){
		for(int i=0;i<weights.length;i++){
			weights[i]+=weightDeltas[i]*rate;
			weightDeltas[i]=0;
		}
	}

	/**
	 * Gets the weight between this nueron and the n-th neuron in the next layer
	 * @param index the index of the neuron in the next layer
	 * @return the weight value
	 */
	public double getWeight(int index){
		return weights[index];
	}

	/**
	 * Sets the ith weight to newWeight
	 * @param i the index of the weight to set
	 * @param newWeight the value to set to 
	 */
	public void setWeight(int i,double newWeight){
		weights[i] = newWeight;
	}

	/**
	 * Adds the given input delta to the delta of the weight
	 * corresponding to the nth neuron in the next layer
	 * @param index the index of the neuron in the next layer
	 * @param delta the value to adjust by
	 */
	public void adjustWeightDelta(int index, double delta){
		weightDeltas[index]+=delta;
	}

	/**
	 * Clear all input, error, and output values.
	 * Used in-between feed-forward calls.
	 * DOES <strong>NOT</strong> CLEAR WEIGHT DELTA MATRICES
	 */
	public void clear(){
		inputValue=0;
		outputValue=0;
		error=0;
	}
	
	/**
	 * Clears the weight delta matrices.
	 */
	public void clearWeightDeltas(){
		weights = new double[weights.length];
	}
	
	/** 
	 * Sets the error.
	 * @param zeta what to set error to
	 */
	public void setError(double zeta){
		error=zeta;
	}

	/**
	 * Returns the error.
	 * @return error
	 */
	public double getError(){
		return error;
	}
	
	/**
	 * Adds to the input value.
	 * @param delta the amount to add to the input value
	 */
	public void add(double delta){
		inputValue+=delta;
	}
	/**
	 * Generates an output value based on the activation function.
	 */
	public void activate(){
		outputValue = actFunction(inputValue);
	}
	/**
	 * Returns the output value
	 * @return the output value
	 */
	public double outputValue(){
		return outputValue;
	}
	/**
	 * Returns the input value
	 * @return the input value
	 */
	public double inputValue(){
		return inputValue;
	}
	/*
	Activation function below is meant to be able to be overridden
	in subclasses to allow for specifying functions.
	*/
	
	/** 
	 * Activation function to be used for forward-propagation
	 * @param zeta
	 * @return zeta after going through activation function
	*/
	public abstract double actFunction(double zeta);
	
	/** 
	 * Derivative of the activation function with input zeta.
	 * Used for backward-propagation.
	 * Must be the derivative of <code>actFunction</code>.
	 * @param zeta input value 
	 * @param active whether or not zeta has gone through 
	 * the activation function.
	 * @return zeta after going through the derivative of <code>actFunction</code>
	 */
	public abstract double derivative(double zeta, boolean active);
	
	/**
	 * Returns the result of passing a value into the mathematical sigmoid function
	 * @param zeta the value to pass into the sigmoid function
	 * @return the return value of passing zeta through the sigmoid function
	 */
	public static double sigmoid(double zeta){
		  return 1.0 / (1 + Math.exp(-zeta));
	}
	/**
	 * Returns the result passing zeta through the derivative of the sigmoid function.
	 * @param zeta the value to pass into the function
	 * @param active whether or not the value has already passed through the sigmoid function
	 * @return the return value of passing zeta through the derivative of the sigmoid function
	 */
	public static double sigDeriv(double zeta, boolean active){
		return active?(zeta*(1-zeta)):sigmoid(zeta)*(1-sigmoid(zeta));
	}
	
}
