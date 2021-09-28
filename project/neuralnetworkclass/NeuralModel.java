package NeuralNetwork;

import java.io.*;
import java.util.Arrays;
/**
 * Class which stores data about the structure of a <code>NeuralNetwork</code>
 * @author Evan Partidas
 *
 */
@SuppressWarnings("serial")
public class NeuralModel implements Serializable{
	private
	int inputSize,outputSize,hiddenLayerCount,hiddenLayerSizes[];
	
	public void setInputSize(int zeta) {
		inputSize = zeta;
	}
	public void setOutputSize(int zeta) {
		outputSize = zeta;
	}
	
	public void setHiddenLayerCount(int zeta) {
		hiddenLayerCount = zeta;
	}
	
	public void setHiddenLayerSize(int zeta) {
		hiddenLayerSizes = new int[hiddenLayerCount];
		for(int i=0;i<hiddenLayerSizes.length;i++)
			hiddenLayerSizes[i] = zeta;
	}
	
	public void setHiddenLayerSizes(int[] zeta) {
		hiddenLayerSizes = Arrays.copyOf(zeta,zeta.length);
		hiddenLayerCount = hiddenLayerSizes.length;
	}
	public int getInputSize() {
		return inputSize;
	}
	public int getOutputSize() {
		return outputSize;
	}
	
	public int getHiddenLayerCount() {
		return hiddenLayerCount;
	}
	
	public int[] getHiddenLayerSizes() {
		return hiddenLayerSizes;
	}
	
	public boolean equals(NeuralModel b) {
		boolean ret = true;
		ret &= inputSize==b.inputSize;
		ret &= outputSize==b.outputSize;
		ret &= hiddenLayerCount==b.hiddenLayerCount;
		for(int i=0;i<hiddenLayerSizes.length;i++)
			ret &= hiddenLayerSizes[i]==b.hiddenLayerSizes[i];
		return ret;
	}
	
}
